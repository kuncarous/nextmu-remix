// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import mantineStyles from '@mantine/core/styles.css?url';
import nextMuStyles from './styles/global.scss?url';
import tailwindStylesheet from './styles/tailwind.css?url';

import {
    ColorSchemeScript,
    MantineColorScheme,
    MantineProvider,
    useMantineColorScheme,
} from '@mantine/core';
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    json,
    useLoaderData,
} from '@remix-run/react';
import i18next from '~/i18next.server';

import type {
    LinksFunction,
    LoaderFunctionArgs,
    MetaFunction,
} from '@remix-run/node';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClientOnly } from 'remix-utils/client-only';
import { parseTheme } from './cookies.server';
import { ErrorBoundary as ErrorBoundaryComponent } from './errors';
import { UserInfoProvider } from './providers/auth';
import { getPublicUserInfoFromSession } from './services/auth.server';
import { setThemeColor } from './utils/theme';

export const links: LinksFunction = () => [
    { rel: 'icon', href: '/favicon.png' },
    { rel: 'stylesheet', href: tailwindStylesheet },
    { rel: 'stylesheet', href: mantineStyles },
    { rel: 'stylesheet', href: nextMuStyles },
];

export const meta: MetaFunction = () => {
    const { t } = useTranslation();
    return [
        { title: t('title') },
        { name: 'description', content: t('description') },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getPublicUserInfoFromSession(request);
    if (user != null && !('roles' in user)) return user;

    const cookieHeader = request.headers.get('Cookie');
    const cookie = await parseTheme(cookieHeader);
    const locale = await i18next.getLocale(request);
    return json({ locale, theme: cookie.mode, user });
}

export const handle = {
    // In the handle export, we can add a i18n key with namespaces our route
    // will need to load. This key can be a single string or an array of strings.
    // TIP: In most cases, you should set this to your defaultNS from your i18n config
    // or if you did not set one, set it to the i18next default namespace "translation"
    i18n: 'common',
};

interface IConfigureThemeFromCookieProps {
    theme: MantineColorScheme;
}
export function ConfigureThemeFromCookie({
    theme,
}: IConfigureThemeFromCookieProps) {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    useLayoutEffect(() => {
        if (theme !== colorScheme) {
            setThemeColor(theme, setColorScheme);
        }
    }, []);
    return null;
}

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
                <ColorSchemeScript defaultColorScheme={theme} />
            </head>
            <body>
                <MantineProvider defaultColorScheme={theme}>
                    <ClientOnly>
                        {() => <ConfigureThemeFromCookie theme={theme} />}
                    </ClientOnly>
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

export function ErrorBoundary() {
    return <ErrorBoundaryComponent />;
}
