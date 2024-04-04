import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback } from 'react';
import { IThemeMode, ThemeCookieName } from '~/consts/theme';
import { setCookieCSR } from '~/utils/cookies';
import styles from './styles.module.scss';

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
                onClick={toggleTheme}
                variant="default"
                size="lg"
                aria-label="Toggle color scheme"
            >
                <IconSun
                    className={classNames(styles.icon, styles.light)}
                    stroke={1.5}
                />
                <IconMoon
                    className={classNames(styles.icon, styles.dark)}
                    stroke={1.5}
                />
            </ActionIcon>
        </>
    );
}
