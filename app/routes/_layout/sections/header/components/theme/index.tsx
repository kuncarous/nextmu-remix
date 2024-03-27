import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import styles from './styles.module.css';
import { useCallback } from "react";
import { useUserInfo } from "~/providers/auth";

export default function ThemeSwitch() {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const userInfo = useUserInfo();

    const toggle = useCallback(
        async () => {
            const theme = colorScheme === 'dark' ? 'light' : 'dark';
            fetch(
                '/action/set-theme',
                {
                    method: 'POST',
                    body: JSON.stringify(
                        {
                            theme,
                        }
                    ),
                }
            );
            setColorScheme(theme);
        },
        [colorScheme]
    );

    return (
        <>
            {userInfo != null ? 'Logged In' : 'Not Logged In'}
            <ActionIcon
                className={styles['theme-toggle']}
                onClick={toggle}
                unstyled
            >
                {
                    colorScheme !== 'dark'
                        ? (
                            <i className="ri-moon-line" />
                        )
                        : (
                            <i className="ri-sun-line" />
                        )
                }
            </ActionIcon>
        </>
    );
}