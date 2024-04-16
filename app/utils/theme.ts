import { MantineColorScheme, useMantineColorScheme } from '@mantine/core';
import { useCallback } from 'react';
import { IThemeMode, ThemeCookieName } from '~/consts/theme';
import { setCookieCSR } from './cookies';

export function setThemeColor(
    colorScheme: MantineColorScheme,
    setColorScheme?: (value: MantineColorScheme) => void,
) {
    setColorScheme?.(colorScheme);
    setCookieCSR<IThemeMode>(ThemeCookieName, { mode: colorScheme });
}

export function useToggleTheme() {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const toggleTheme = useCallback(() => {
        const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
        setThemeColor(newColorScheme, setColorScheme);
    }, [colorScheme]);

    return { toggleTheme };
}
