// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import mantineStyles from '@mantine/core/styles.css?url';

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    json,
    useLoaderData,
} from "@remix-run/react";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import i18next from "~/i18next.server";

import './styles/global.css';
import { useTranslation } from 'react-i18next';
import { userPrefs } from './cookies.server';
import { getUserFromSession, redirectToLogout, refreshSession } from './services/auth.server';
import { UserInfoProvider } from './providers/auth';

export const links: LinksFunction = () => [
    { rel: "icon", href: "favicon.png" },
    { rel: "stylesheet", href: mantineStyles },
    { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
    let user = await getUserFromSession(request, context);
    if (user != null && user.expired == true) {
        let redirectTo = await refreshSession(request, context);
        if (redirectTo == null) redirectTo = await redirectToLogout(request, context);
        if (redirectTo != null) return redirectTo;
        user = null;
    }

    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};
    const locale = await i18next.getLocale(request);
    return json({ locale, theme: cookie.theme || 'light', user });
}

export const handle = {
    // In the handle export, we can add a i18n key with namespaces our route
    // will need to load. This key can be a single string or an array of strings.
    // TIP: In most cases, you should set this to your defaultNS from your i18n config
    // or if you did not set one, set it to the i18next default namespace "translation"
    i18n: "common",
};

export default function App() {
    const { locale, theme, user } = useLoaderData<typeof loader>();
    const { i18n } = useTranslation();

    return (
        <html lang={locale} dir={i18n.dir()}>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width,initial-scale=1"
                />
                <Meta />
                <Links />
                <ColorSchemeScript />
            </head>
            <body>
                <MantineProvider defaultColorScheme={theme}>
                    <UserInfoProvider userInfo={user ?? null}>
                        <Outlet />
                        <ScrollRestoration />
                        <Scripts />
                    </UserInfoProvider>
                </MantineProvider>
            </body>
        </html>
    );
}