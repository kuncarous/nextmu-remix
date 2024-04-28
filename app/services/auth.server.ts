import {
    AppLoadContext,
    SessionStorage,
    createCookieSessionStorage,
    redirect,
} from '@remix-run/cloudflare';
import * as oidc from 'oauth4webapi';
import {
    IUserInfo,
    UserInfoVersion,
    ZPublicUserInfo,
} from '~/providers/auth/types';
import * as url from '~/utils/url';
import { createOrFindAccount } from './mongodb/account.server';
import { getSessionFromRedis, saveSessionInRedis } from './redis/auth.server';

interface ISessionRequestData {
    redirect_url?: string;
    code_challenge_method: string;
    code_challenge: string;
    code_verifier: string;
    nonce?: string;
}

let sessionRequestStorage: SessionStorage<ISessionRequestData> | null = null;
export const getSessionRequestStorage = async (context: AppLoadContext) => {
    if (sessionRequestStorage != null) return sessionRequestStorage;
    sessionRequestStorage = createCookieSessionStorage<ISessionRequestData>({
        cookie: {
            name: '_session_req', // use any name you want here
            sameSite: 'lax', // this helps with CSRF
            path: '/', // remember to add this so the cookie will work in all routes
            httpOnly: true, // for security reasons, make this cookie http only
            secrets: [context.cloudflare.env.SESSION_REQUEST_COOKIE_SECRET], // replace this with an actual secret
            secure: context.cloudflare.env.NODE_ENV === 'production', // enable this in prod only
        },
    });
    return sessionRequestStorage;
};

let sessionStorage: SessionStorage<oidc.OpenIDTokenEndpointResponse> | null =
    null;
export const getSessionStorage = async (context: AppLoadContext) => {
    if (sessionStorage != null) return sessionStorage;
    sessionStorage =
        createCookieSessionStorage<oidc.OpenIDTokenEndpointResponse>({
            cookie: {
                name: '_session', // use any name you want here
                sameSite: 'lax', // this helps with CSRF
                path: '/', // remember to add this so the cookie will work in all routes
                httpOnly: true, // for security reasons, make this cookie http only
                secrets: [context.cloudflare.env.SESSION_COOKIE_SECRET], // replace this with an actual secret
                secure: context.cloudflare.env.NODE_ENV === 'production', // enable this in prod only
            },
        });
    return sessionStorage;
};

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
};

let portalAuthClient: oidc.Client | null = null;
export const getPortalAuthClient = async (context: AppLoadContext) => {
    if (portalAuthClient != null) return portalAuthClient;
    portalAuthClient = {
        client_id: context.cloudflare.env.PORTAL_OPENID_CLIENT_ID!,
        client_secret:
            context.cloudflare.env.PORTAL_OPENID_CLIENT_SECRET || undefined,
        token_endpoint_auth_method: (context.cloudflare.env
            .PORTAL_OPENID_AUTH_METHOD ||
            'none') as oidc.ClientAuthenticationMethod,
    };
    return portalAuthClient;
};

let portalApiAuthClient: oidc.Client | null = null;
export const getPortalApiAuthClient = async (context: AppLoadContext) => {
    if (portalApiAuthClient != null) return portalApiAuthClient;
    portalApiAuthClient = {
        client_id: context.cloudflare.env.PORTAL_API_OPENID_CLIENT_ID!,
        client_secret: context.cloudflare.env.PORTAL_API_OPENID_CLIENT_SECRET!,
        token_endpoint_auth_method: (context.cloudflare.env
            .PORTAL_API_OPENID_AUTH_METHOD ||
            'client_secret_basic') as oidc.ClientAuthenticationMethod,
    };
    return portalApiAuthClient;
};

export const getAccessToken = async (
    request: Request,
    context: AppLoadContext,
) => {
    try {
        const sessionStorage = await getSessionStorage(context);
        if (sessionStorage == null) return null;

        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader) return null;

        const sessionData = await sessionStorage.getSession(cookieHeader);
        if (sessionData.has('access_token') == false) return null;

        return sessionData.get('access_token')!;
    } catch (e) {
        return null;
    }
};

const code_challenge_method = 'S256';
export const redirectToLogin = async (
    context: AppLoadContext,
    req?: Request,
) => {
    try {
        const sessionRequestStorage = await getSessionRequestStorage(context);
        if (sessionRequestStorage == null) return null;

        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const code_verifier = oidc.generateRandomCodeVerifier();
        const code_challenge =
            await oidc.calculatePKCECodeChallenge(code_verifier);
        let nonce: string | undefined;

        const authorizationUrl = new URL(authServer.authorization_endpoint!);
        authorizationUrl.searchParams.set(
            'client_id',
            context.cloudflare.env.PORTAL_OPENID_CLIENT_ID!,
        );
        authorizationUrl.searchParams.set(
            'redirect_uri',
            url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/login/callback'),
        );
        authorizationUrl.searchParams.set('response_type', 'code');
        authorizationUrl.searchParams.set(
            'scope',
            [
                'openid profile email offline_access',
                context.cloudflare.env.PORTAL_OPENID_ADDITIONAL_SCOPES,
            ]
                .filter((v) => !!v)
                .join(' '),
        );

        const sessionRequest = await sessionRequestStorage.getSession();
        if (req != null) sessionRequest.set('redirect_url', req.url);
        sessionRequest.set('code_challenge', code_challenge);
        sessionRequest.set('code_verifier', code_verifier);

        if (
            authServer.code_challenge_methods_supported?.includes(
                code_challenge_method,
            ) == false
        ) {
            nonce = oidc.generateRandomNonce();
            authorizationUrl.searchParams.set('nonce', nonce);
            sessionRequest.set('code_challenge_method', 'nonce');
            sessionRequest.set('nonce', nonce);
        } else {
            authorizationUrl.searchParams.set('code_challenge', code_challenge);
            authorizationUrl.searchParams.set(
                'code_challenge_method',
                code_challenge_method,
            );
            sessionRequest.set('code_challenge_method', code_challenge_method);
        }

        authorizationUrl.searchParams.set('prompt', 'login');

        const cookie =
            await sessionRequestStorage.commitSession(sessionRequest);
        return redirect(authorizationUrl.href, {
            headers: { 'Set-Cookie': cookie },
        });
    } catch (error) {
        return null;
    }
};

export const redirectToRegister = async (
    context: AppLoadContext,
    req?: Request,
) => {
    try {
        const sessionRequestStorage = await getSessionRequestStorage(context);
        if (sessionRequestStorage == null) return null;

        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const code_verifier = oidc.generateRandomCodeVerifier();
        const code_challenge =
            await oidc.calculatePKCECodeChallenge(code_verifier);
        let nonce: string | undefined;

        const authorizationUrl = new URL(authServer.authorization_endpoint!);
        authorizationUrl.searchParams.set(
            'client_id',
            context.cloudflare.env.PORTAL_OPENID_CLIENT_ID!,
        );
        authorizationUrl.searchParams.set(
            'redirect_uri',
            url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/login/callback'),
        );
        authorizationUrl.searchParams.set('response_type', 'code');
        authorizationUrl.searchParams.set(
            'scope',
            [
                'openid profile email offline_access',
                context.cloudflare.env.PORTAL_OPENID_ADDITIONAL_SCOPES,
            ]
                .filter((v) => !!v)
                .join(' '),
        );

        const sessionRequest = await sessionRequestStorage.getSession();
        if (req != null) sessionRequest.set('redirect_url', req.url);
        sessionRequest.set('code_challenge', code_challenge);
        sessionRequest.set('code_verifier', code_verifier);

        if (
            authServer.code_challenge_methods_supported?.includes(
                code_challenge_method,
            ) == false
        ) {
            nonce = oidc.generateRandomNonce();
            authorizationUrl.searchParams.set('nonce', nonce);
            sessionRequest.set('code_challenge_method', 'nonce');
            sessionRequest.set('nonce', nonce);
        } else {
            authorizationUrl.searchParams.set('code_challenge', code_challenge);
            authorizationUrl.searchParams.set(
                'code_challenge_method',
                code_challenge_method,
            );
            sessionRequest.set('code_challenge_method', code_challenge_method);
        }

        authorizationUrl.searchParams.set('prompt', 'create');

        const cookie =
            await sessionRequestStorage.commitSession(sessionRequest);
        return redirect(authorizationUrl.href, {
            headers: { 'Set-Cookie': cookie },
        });
    } catch (error) {
        return null;
    }
};

export const redirectToSwitch = async (
    context: AppLoadContext,
    req?: Request,
) => {
    try {
        const sessionRequestStorage = await getSessionRequestStorage(context);
        if (sessionRequestStorage == null) return null;

        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const code_verifier = oidc.generateRandomCodeVerifier();
        const code_challenge =
            await oidc.calculatePKCECodeChallenge(code_verifier);
        let nonce: string | undefined;

        const authorizationUrl = new URL(authServer.authorization_endpoint!);
        authorizationUrl.searchParams.set(
            'client_id',
            context.cloudflare.env.PORTAL_OPENID_CLIENT_ID!,
        );
        authorizationUrl.searchParams.set(
            'redirect_uri',
            url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/login/callback'),
        );
        authorizationUrl.searchParams.set('response_type', 'code');
        authorizationUrl.searchParams.set(
            'scope',
            [
                'openid profile email offline_access',
                context.cloudflare.env.PORTAL_OPENID_ADDITIONAL_SCOPES,
            ]
                .filter((v) => !!v)
                .join(' '),
        );

        const sessionRequest = await sessionRequestStorage.getSession();
        if (req != null) sessionRequest.set('redirect_url', req.url);
        sessionRequest.set('code_challenge', code_challenge);
        sessionRequest.set('code_verifier', code_verifier);

        if (
            authServer.code_challenge_methods_supported?.includes(
                code_challenge_method,
            ) == false
        ) {
            nonce = oidc.generateRandomNonce();
            authorizationUrl.searchParams.set('nonce', nonce);
            sessionRequest.set('code_challenge_method', 'nonce');
            sessionRequest.set('nonce', nonce);
        } else {
            authorizationUrl.searchParams.set('code_challenge', code_challenge);
            authorizationUrl.searchParams.set(
                'code_challenge_method',
                code_challenge_method,
            );
            sessionRequest.set('code_challenge_method', code_challenge_method);
        }

        authorizationUrl.searchParams.set('prompt', 'select_account');

        const cookie =
            await sessionRequestStorage.commitSession(sessionRequest);
        return redirect(authorizationUrl.href, {
            headers: { 'Set-Cookie': cookie },
        });
    } catch (error) {
        return null;
    }
};

export const processAuthResponse = async (
    request: Request,
    context: AppLoadContext,
) => {
    const sessionRequestStorage = await getSessionRequestStorage(context);
    if (sessionRequestStorage == null) return redirect('/');

    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return redirect('/');

    const cookieHeader = request.headers.get('Cookie');
    const sessionRequest = await sessionRequestStorage.getSession(cookieHeader);

    try {
        const authServer = await getAuthorizationServer(context);
        if (authServer == null) throw new Error('missing auth server metadata');

        const client = await getPortalAuthClient(context);
        const currentUrl = new URL(request.url);
        const params = oidc.validateAuthResponse(
            authServer,
            client,
            currentUrl,
        );
        if (oidc.isOAuth2Error(params)) {
            throw new Error('failed to validate auth response');
        }

        const authorizationResponse = await oidc.authorizationCodeGrantRequest(
            authServer,
            client,
            params,
            url.resolve(context.cloudflare.env.SITE_DOMAIN!, '/login/callback'),
            sessionRequest.get('code_verifier')!,
        );
        if (!authorizationResponse.ok) {
            throw new Error('failed to retrieve access token');
        }

        const nonce = sessionRequest.get('nonce');
        const authorizationResult =
            await oidc.processAuthorizationCodeOpenIDResponse(
                authServer,
                client,
                authorizationResponse,
                nonce,
            );
        if (oidc.isOAuth2Error(authorizationResult)) {
            throw new Error('failed to process authorization code response');
        }

        const apiClient = await getPortalApiAuthClient(context);
        const introspectionResponse = await oidc.introspectionRequest(
            authServer,
            apiClient,
            authorizationResult.access_token,
            {
                additionalParameters: {
                    token_hint_type: 'access_token',
                },
            },
        );
        if (!introspectionResponse.ok) {
            throw new Error('failed to retrieve introspection response');
        }

        const introspectionResult = await oidc.processIntrospectionResponse(
            authServer,
            apiClient,
            introspectionResponse,
        );
        if (
            oidc.isOAuth2Error(introspectionResult) ||
            introspectionResult.active == false
        ) {
            throw new Error('failed to process introspection response');
        }

        const accountId = await createOrFindAccount(
            introspectionResult as oidc.IntrospectionResponse,
            context,
        );
        if (accountId == null) {
            throw new Error('failed to create or find account');
        }

        const userInfo: IUserInfo = {
            version: UserInfoVersion,
            aud: introspectionResult.aud!,
            sub: introspectionResult.sub!,
            email: introspectionResult.email as string | undefined,
            email_verified: introspectionResult.email_verified as
                | boolean
                | undefined,
            given_name: introspectionResult.given_name as string | undefined,
            family_name: introspectionResult.family_name as string | undefined,
            expire_at: introspectionResult.exp,
            roles: Object.keys(
                introspectionResult['urn:zitadel:iam:org:project:roles'] ?? {},
            ),
        };
        await saveSessionInRedis(
            context,
            context.cloudflare.env.OPENID_PROJECT_ID!,
            authorizationResult.access_token,
            userInfo,
        );

        const session = await sessionStorage.getSession();
        const resultEntries = Object.entries(authorizationResult);
        for (const [key, value] of resultEntries) {
            if (!value) continue;
            session.set('account_id', accountId.toHexString());
            session.set(key, value);
        }

        const redirectUrl: string = sessionRequest.get(
            'redirect_url',
        ) as string;
        return redirect(redirectUrl || '/', {
            headers: [
                [
                    'Set-Cookie',
                    await sessionRequestStorage.destroySession(sessionRequest),
                ],
                ['Set-Cookie', await sessionStorage.commitSession(session)],
            ],
        });
    } catch (error) {
        const cookie =
            await sessionRequestStorage.destroySession(sessionRequest);
        return redirect('/', { headers: { 'Set-Cookie': cookie } });
    }
};

export const redirectToLogout = async (
    request: Request,
    context: AppLoadContext,
) => {
    try {
        const sessionStorage = await getSessionStorage(context);
        if (sessionStorage == null) return null;

        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader) return null;

        const sessionData = await sessionStorage.getSession(cookieHeader);
        if (sessionData.has('access_token') == false) return null;

        const endSessionUrl = new URL(authServer.end_session_endpoint!);
        endSessionUrl.searchParams.set(
            'client_id',
            context.cloudflare.env.PORTAL_OPENID_CLIENT_ID!,
        );
        endSessionUrl.searchParams.set(
            'post_logout_redirect_uri',
            url.resolve(
                context.cloudflare.env.SITE_DOMAIN!,
                '/logout/callback',
            ),
        );
        if (sessionData.has('id_token'))
            endSessionUrl.searchParams.set(
                'id_token_hint',
                sessionData.get('id_token')!,
            );

        return redirect(endSessionUrl.href);
    } catch (error) {
        return null;
    }
};

export const processLogoutResponse = async (
    request: Request,
    context: AppLoadContext,
) => {
    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return redirect('/');

    const cookieHeader = request.headers.get('Cookie');
    const session = await sessionStorage.getSession(cookieHeader);

    const cookie = await sessionStorage.destroySession(session);
    return redirect('/', { headers: { 'Set-Cookie': cookie } });
};

export const refreshSession = async (
    request: Request,
    context: AppLoadContext,
) => {
    const authServer = await getAuthorizationServer(context);
    if (authServer == null) return null;

    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return null;

    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    const sessionData = await sessionStorage.getSession(cookieHeader);
    if (sessionData.has('refresh_token') == false) return null;

    const client = await getPortalAuthClient(context);
    const response = await oidc.refreshTokenGrantRequest(
        authServer,
        client,
        sessionData.get('refresh_token')!,
    );
    if (!response.ok) return null;

    const result = await oidc.processRefreshTokenResponse(
        authServer,
        client,
        response,
    );
    if (oidc.isOAuth2Error(result)) return null;

    const newSession = await sessionStorage.getSession();
    const resultEntries = Object.entries(result);
    for (const [key, value] of resultEntries) {
        if (!value) continue;
        newSession.set(key, value);
    }

    const cookie = await sessionStorage.commitSession(newSession);
    return redirect(request.url, { headers: { 'Set-Cookie': cookie } });
};

export const clearSession = async (
    request: Request,
    context: AppLoadContext,
) => {
    const authServer = await getAuthorizationServer(context);
    if (authServer == null) return null;

    const sessionStorage = await getSessionStorage(context);
    if (sessionStorage == null) return null;

    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    const sessionData = await sessionStorage.getSession(cookieHeader);
    if (sessionData.has('access_token') == false) return null;

    const cookie = await sessionStorage.destroySession(sessionData);
    return redirect(request.url, { headers: { 'Set-Cookie': cookie } });
};

export const getUserInfo = async (
    context: AppLoadContext,
    accessToken: string,
    options?: oidc.UserInfoRequestOptions,
) => {
    try {
        const authServer = await getAuthorizationServer(context);
        if (authServer == null) return null;

        const response = await oidc.userInfoRequest(
            authServer,
            await getPortalAuthClient(context),
            accessToken,
            options,
        );
        if (!response.ok) {
            return null;
        }

        return await oidc.processDiscoveryResponse(
            new URL(context.cloudflare.env.PORTAL_OPENID_ISSUER_URL!),
            response,
        );
    } catch (error) {
        return null;
    }
};

export const isAuthenticated = async (
    request: Request,
    context: AppLoadContext,
    accessToken: string | null = null,
) => {
    if (accessToken == null) {
        accessToken = await getAccessToken(request, context);
    }
    if (accessToken == null) return false;

    const cachedSession = await getSessionFromRedis(
        context,
        context.cloudflare.env.OPENID_PROJECT_ID!,
        accessToken,
    );
    if (cachedSession != null) return true;

    const authServer = await getAuthorizationServer(context);
    if (authServer == null) return false;

    const apiClient = await getPortalApiAuthClient(context);
    const introspectionResponse = await oidc.introspectionRequest(
        authServer,
        apiClient,
        accessToken,
        {
            additionalParameters: {
                token_hint_type: 'access_token',
            },
        },
    );
    if (!introspectionResponse.ok) {
        return false;
    }

    const introspectionResult = await oidc.processIntrospectionResponse(
        authServer,
        apiClient,
        introspectionResponse,
    );
    if (oidc.isOAuth2Error(introspectionResult)) {
        return false;
    }

    if (introspectionResult.active == false) {
        return await refreshSession(request, context);
    }

    const userInfo: IUserInfo = {
        version: UserInfoVersion,
        aud: introspectionResult.aud!,
        sub: introspectionResult.sub!,
        email: introspectionResult.email as string | undefined,
        email_verified: introspectionResult.email_verified as
            | boolean
            | undefined,
        given_name: introspectionResult.given_name as string | undefined,
        family_name: introspectionResult.family_name as string | undefined,
        expire_at: introspectionResult.exp,
        roles: Object.keys(
            introspectionResult['urn:zitadel:iam:org:project:roles'] ?? {},
        ),
    };
    await saveSessionInRedis(
        context,
        context.cloudflare.env.OPENID_PROJECT_ID!,
        accessToken,
        userInfo,
    );

    return true;
};

export const getPublicUserInfoFromSession = async (
    request: Request,
    context: AppLoadContext,
    accessToken: string | null = null,
) => {
    if (accessToken == null) {
        accessToken = await getAccessToken(request, context);
    }
    if (accessToken == null) return null;

    const cachedSession = await getSessionFromRedis(
        context,
        context.cloudflare.env.OPENID_PROJECT_ID!,
        accessToken,
    );
    if (cachedSession != null) return ZPublicUserInfo.parse(cachedSession);

    const authServer = await getAuthorizationServer(context);
    if (authServer == null) return null;

    const apiClient = await getPortalApiAuthClient(context);
    const introspectionResponse = await oidc.introspectionRequest(
        authServer,
        apiClient,
        accessToken,
        {
            additionalParameters: {
                token_hint_type: 'access_token',
            },
        },
    );
    if (!introspectionResponse.ok) {
        return null;
    }

    const introspectionResult = await oidc.processIntrospectionResponse(
        authServer,
        apiClient,
        introspectionResponse,
    );
    if (oidc.isOAuth2Error(introspectionResult)) {
        return null;
    }

    if (introspectionResult.active == false) {
        const response = await refreshSession(request, context);
        if (response != null) return response;
        return await clearSession(request, context);
    }

    const userInfo: IUserInfo = {
        version: UserInfoVersion,
        aud: introspectionResult.aud!,
        sub: introspectionResult.sub!,
        email: introspectionResult.email as string | undefined,
        email_verified: introspectionResult.email_verified as
            | boolean
            | undefined,
        given_name: introspectionResult.given_name as string | undefined,
        family_name: introspectionResult.family_name as string | undefined,
        expire_at: introspectionResult.exp,
        roles: Object.keys(
            introspectionResult['urn:zitadel:iam:org:project:roles'] ?? {},
        ),
    };
    if (
        userInfo.expire_at != null &&
        Date.now() * 0.001 >= userInfo.expire_at
    ) {
        const response = await refreshSession(request, context);
        if (response != null) return response;
        return await clearSession(request, context);
    }

    await saveSessionInRedis(
        context,
        context.cloudflare.env.OPENID_PROJECT_ID!,
        accessToken,
        userInfo,
    );

    return ZPublicUserInfo.parse(userInfo);
};
