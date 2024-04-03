import {
    ActionIcon,
    useComputedColorScheme,
    useMantineColorScheme,
} from '@mantine/core';
import { useCallback } from 'react';
import { IThemeMode, ThemeCookieName } from '~/consts/theme';
import { setCookieCSR } from '~/utils/cookies';
import styles from './styles.module.css';

export default function ThemeSwitch() {
    const { setColorScheme } = useMantineColorScheme();
    const colorScheme = useComputedColorScheme('light');
    const toggleTheme = useCallback(() => {
        const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
        setColorScheme(newColorScheme);
        setCookieCSR<IThemeMode>(ThemeCookieName, { mode: newColorScheme });
    }, [colorScheme]);

    return (
        <>
            <ActionIcon
                type="submit"
                className={styles['theme-toggle']}
                onClick={toggleTheme}
                unstyled
            >
                {colorScheme !== 'dark' ? (
                    <i className="ri-moon-line" />
                ) : (
                    <i className="ri-sun-line" />
                )}
            </ActionIcon>
        </>
    );
}
