import { ActionIcon, rem, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useCallback } from 'react';
import { IThemeMode, ThemeCookieName } from '~/consts/theme';
import { setCookieCSR } from '~/utils/cookies';

export default function ThemeSwitch() {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const toggleTheme = useCallback(() => {
        const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
        setColorScheme(newColorScheme);
        setCookieCSR<IThemeMode>(ThemeCookieName, { mode: newColorScheme });
    }, [colorScheme]);

    return (
        <>
            <ActionIcon
                variant="outline"
                onClick={toggleTheme}
                size={rem(16)}
                unstyled
            >
                {colorScheme !== 'dark' ? (
                    <IconMoon
                        style={{ width: rem(16), height: rem(16) }}
                        stroke={1.5}
                    />
                ) : (
                    <IconSun
                        style={{ width: rem(16), height: rem(16) }}
                        stroke={1.5}
                    />
                )}
            </ActionIcon>
        </>
    );
}
