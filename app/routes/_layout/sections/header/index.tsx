import { Group, useMantineColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import ThemeSwitch from './components/theme';
import styles from './styles.module.css';

export default function Header() {
    const { colorScheme } = useMantineColorScheme();
    const isMobile = useMediaQuery('(max-width: 600px)');

    return (
        <>
            <header className={styles.header}>
                <Group align="center" justify="space-between" h="100%">
                    <a href="/">
                        <img
                            className={styles.logo}
                            src={
                                colorScheme === 'dark'
                                    ? "/images/nextmu_white.png"
                                    : "/images/nextmu_black.png"
                            }
                        />
                    </a>
                    <Group align="center" justify="flex-end" pr={16}>
                        <ThemeSwitch />
                    </Group>
                </Group>
            </header>
        </>
    );
}