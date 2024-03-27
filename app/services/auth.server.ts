import {
    redirect,
    SessionStorage,
    createCookieSessionStorage,
    SessionData,
    AppLoadContext,
} from "@remix-run/cloudflare";
import * as oidc from "oauth4webapi";
import * as jwt from "jsonwebtoken";
import * as url from "~/utils/url";
import { getAuthSession, registerAuthSession, updateAuthSession } from "./mongodb/auth.server";
import { ObjectId } from "mongodb";
import { UserInfo } from "~/providers/auth/types";
import { fromUnixTime, isBefore } from "date-fns";

interface IIdToken extends jwt.JwtPayload {
    session_state: string;
    auth_time: number;

    email: string;
    email_verified: boolean;

    name: string; // John Doe
    given_name: string; // John
    family_name: string; // Doe
    preferred_username: string; // johndoe1

    sid: string;
    acr: string;
    typ: string;
    azp: string;
    at_hash: string;
}

let sessionStorage: SessionStorage<SessionData, SessionData> | null = null;
export const getSessionStorage = async (context: AppLoadContext) => {
    if (sessionStorage != null) return sessionStorage;
    sessionStorage = createCookieSessionStorage({
        cookie: {
            name: "_session", // use any name you want here
            sameSite: "lax", // this helps with CSRF
            path: "/", // remember to add this so the cookie will work in all routes
            httpOnly: true, // for security reasons, make this cookie http only
            secrets: [context.cloudflare.env.SESSION_COOKIE_SECRET], // replace this with an actual secret
            secure: process.env.NODE_ENV === "production", // enable this in prod only
        },
    });
    return sessionStorage;
}

let authorizationServer: oidc.AuthorizationServer | null = null;
export const getAuthorizationServer = async (context: AppLoadContext) => {
    try {
        if (authorizationServer != null) return authorizationServer;

        const url = new URL(context.cloudflare.env.OPENID_ISSUER_URL!);
        const response = await oidc.discoveryRequest(url);
        if (!response.ok) {
            return null;
        }

        return await oidc.processDiscoveryResponse(url, response);
    } catch (error) {
        return null;
    }
}

let authClient: oidc.Client | null = null;
export const getAuthClient = async (context: AppLoadContext) => {
    if (authClient != null) return authClient;
    authClient = {
        client_id: context.cloudflare.env.OPENID_CLIENT_ID!,
        client_secret: context.cloudflare.env.OPENID_CLIENT_SECRET || undefined,
        token_endpoint_auth_method: (context.cloudflare.env.OPENID_AUTH_METHOD || 'none') as oidc.ClientAuthenticationMethod,
    };
    return authClient;
}

const code_challenge_method = 'S256';
export const redirectToAuth = async (context: AppLoadContext) => {
    try {
        const sessionStorage = await getSessionStorage(context);
        if (sessionStorage == null) return null;

        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const code_verifier = oidc.generateRandomCodeVerifier();
        const code_challenge = await oidc.calculatePKCECodeChallenge(code_verifier);
        let nonce: string | undefined;

        const authorizationUrl = new URL(authServer.authorization_endpoint!);
        authorizationUrl.searchParams.set('client_id', context.cloudflare.env.OPENID_CLIENT_ID!);
        authorizationUrl.searchParams.set('redirect_uri', url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/login/callback'));
        authorizationUrl.searchParams.set('response_type', 'code');
        authorizationUrl.searchParams.set('scope', 'openid profile email');

        const session = await sessionStorage.getSession();
        if (authServer.code_challenge_methods_supported?.includes('S256') == false) {
            nonce = oidc.generateRandomNonce();
            authorizationUrl.searchParams.set('nonce', nonce);
            session.set('challenge_method', 'nonce');
            session.set('nonce', nonce);
        }
        else {
            authorizationUrl.searchParams.set('code_challenge', code_challenge);
            authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method);
            session.set('challenge_method', code_challenge_method);
            session.set('code_challenge', code_challenge);
            session.set('code_verifier', code_verifier);
        }

        const cookie = await sessionStorage.commitSession(session);
        return redirect(authorizationUrl.href, { headers: { 'Set-Cookie': cookie } });
    } catch (error) {
        return null;
    }
}

export const processAuthResponse = async (request: Request, context: AppLoadContext) => {
    if (await isAuthenticated(request, context)) return redirect('/');

    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return redirect('/');
    
    const cookieHeader = request.headers.get("Cookie");
    const session = await sessionStorage.getSession(cookieHeader);

    try {
        const authServer = await getAuthorizationServer(context);
        if (authServer == null) throw new Error('missing auth server metadata');

        const client = await getAuthClient(context);
        const currentUrl = new URL(request.url);
        const params = oidc.validateAuthResponse(authServer, client, currentUrl);
        if (oidc.isOAuth2Error(params)) {
            throw new Error('failed to validate auth response');
        }

        const response = await oidc.authorizationCodeGrantRequest(
            authServer,
            client,
            params,
            url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/login/callback'),
            session.get('code_verifier'),
        );
        if (!response.ok) {
            throw new Error('failed to retrieve access token');
        }

        const nonce = session.get('nonce');
        const result = await oidc.processAuthorizationCodeOpenIDResponse(authServer, client, response, nonce);
        if (oidc.isOAuth2Error(result)) {
            throw new Error('failed to process authorization code response');
        }

        const sessionResult = await registerAuthSession(result, context);
        if (sessionResult == null) {
            throw new Error('failed to register auth session');
        }

        const newSession = await sessionStorage.getSession();
        const resultEntries = Object.entries(sessionResult);
        for (const [key, value] of resultEntries)
        {
            if (!value) continue;
            newSession.set(key, value);
        }

        const cookie = await sessionStorage.commitSession(newSession);
        return redirect('/', { headers: { 'Set-Cookie': cookie } });
    } catch(error) {
        const cookie = await sessionStorage.destroySession(session);
        return redirect('/', { headers: { 'Set-Cookie': cookie } });
    }
}

export const redirectToLogout = async (request: Request, context: AppLoadContext) => {
    try {
        const sessionStorage = await getSessionStorage(context);
        if (sessionStorage == null) return null;

        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;
            
        const cookieHeader = request.headers.get("Cookie");
        if (!cookieHeader) return null;
        
        const sessionData = await sessionStorage.getSession(cookieHeader);
        if (sessionData.has('sessionId') == false) return null;
        
        const session = await getAuthSession(ObjectId.createFromHexString(sessionData.get('sessionId')), Buffer.from(sessionData.get('key'), 'base64'), context);
        if (session == null) return null;

        const endSessionUrl = new URL(authServer.end_session_endpoint!);
        endSessionUrl.searchParams.set('client_id', context.cloudflare.env.OPENID_CLIENT_ID!);
        endSessionUrl.searchParams.set('post_logout_redirect_uri', url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/logout/callback'));
        endSessionUrl.searchParams.set('id_token_hint', session.id_token);
        
        return redirect(endSessionUrl.href);
    } catch (error) {
        return null;
    }
}

export const processLogoutResponse = async (request: Request, context: AppLoadContext) => {
    if (!await isAuthenticated(request, context)) return redirect('/');

    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return redirect('/');
    
    const cookieHeader = request.headers.get("Cookie");
    const session = await sessionStorage.getSession(cookieHeader);

    const cookie = await sessionStorage.destroySession(session);
    return redirect('/', { headers: { 'Set-Cookie': cookie } });
}

export const refreshSession = async (request: Request, context: AppLoadContext) => {
    const authServer = await getAuthorizationServer(context);
    if (authServer == null) return null;
    
    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return null;

    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return null;

    const sessionData = await sessionStorage.getSession(cookieHeader);
    if (sessionData.has('sessionId') == false) return null;

    const session = await getAuthSession(ObjectId.createFromHexString(sessionData.get('sessionId')), Buffer.from(sessionData.get('key'), 'base64'), context);
    if (session == null || !session.refresh_token) return null;

    const client = await getAuthClient(context);
    const response = await oidc.refreshTokenGrantRequest(authServer, client, session.refresh_token);
    if (!response.ok) return null;

    const result = await oidc.processRefreshTokenResponse(authServer, client, response);
    if (oidc.isOAuth2Error(result)) return null;

    const sessionResult = await updateAuthSession(ObjectId.createFromHexString(sessionData.get('sessionId')), { ...session, ...result }, context);
    if (sessionResult == null) return null;

    const newSession = await sessionStorage.getSession();
    const resultEntries = Object.entries(sessionResult);
    for (const [key, value] of resultEntries)
    {
        if (!value) continue;
        newSession.set(key, value);
    }

    const cookie = await sessionStorage.commitSession(newSession);
    return redirect(request.url, { headers: { 'Set-Cookie': cookie } });
}

export const getUserInfo = async (context: AppLoadContext, accessToken: string, options?: oidc.UserInfoRequestOptions) => {
    try {
        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const response = await oidc.userInfoRequest(authServer, await getAuthClient(context), accessToken, options);
        if (!response.ok) {
            return null;
        }

        return await oidc.processDiscoveryResponse(new URL(context.cloudflare.env.OPENID_ISSUER_URL!), response);
    } catch (error) {
        return null;
    }
}

export const isAuthenticated = async (request: Request, context: AppLoadContext) => {
    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return null;

    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return false;

    const sessionData = await sessionStorage.getSession(cookieHeader);
    return sessionData.has('sessionId');
}

export const getUserFromSession = async (request: Request, context: AppLoadContext) => {
    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return null;

    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return null;

    const sessionData = await sessionStorage.getSession(cookieHeader);
    if (sessionData.has('sessionId') == false) return null;

    const session = await getAuthSession(ObjectId.createFromHexString(sessionData.get('sessionId')), Buffer.from(sessionData.get('key'), 'base64'), context);
    if (session == null) return null;

    const user = jwt.decode(session.id_token, { json: true }) as IIdToken;

    return {
        aud: user.aud!,
        sub: user.sub!,
        email: user.email,
        email_verified: user.email_verified,
        given_name: user.given_name,
        family_name: user.family_name,
        expire_at: user.exp,
        expired: user.exp != null && isBefore(fromUnixTime(user.exp), new Date()),
    } as UserInfo;
}