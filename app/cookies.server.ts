import { createCookie } from '@remix-run/node';
import {
    DefaultThemeMode,
    IThemeMode,
    ThemeCookieName,
    ZThemeMode,
} from './consts/theme';

const theme = createCookie(ThemeCookieName, {
    maxAge: 604_800,
});

export const parseTheme = async (cookieHeader: string | null) => {
    const cookie = await theme.parse(cookieHeader);
    const parsed = ZThemeMode.safeParse(cookie);
    if (!parsed.success) return DefaultThemeMode;
    return {
        ...DefaultThemeMode,
        ...parsed.data,
    };
};

export const setThemeInCookie = async (data: IThemeMode) => {
    const parsed = ZThemeMode.safeParse(data);
    const dataToSerialize = {
        ...DefaultThemeMode,
        ...(parsed.success ? parsed.data : {}),
    };
    return theme.serialize(dataToSerialize);
};
