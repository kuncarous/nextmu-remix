import { useMantineColorScheme } from '@mantine/core';
import { Link } from '@remix-run/react';
import styles from './styles.module.scss';

export function Logo() {
    const { colorScheme } = useMantineColorScheme();
    return (
        <Link to="/">
            <img
                className={styles.logo}
                src={
                    colorScheme === 'dark'
                        ? '/images/nextmu_white_sm.png'
                        : '/images/nextmu_black_sm.png'
                }
            />
        </Link>
    );
}

export function LogoSide() {
    const { colorScheme } = useMantineColorScheme();
    return (
        <Link to="/">
            <img
                className={styles.logo}
                src={
                    colorScheme === 'dark'
                        ? '/images/nextmu_side_white.png'
                        : '/images/nextmu_side_black.png'
                }
            />
        </Link>
    );
}
