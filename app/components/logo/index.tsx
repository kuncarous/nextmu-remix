import { useMantineColorScheme } from '@mantine/core';
import { Link } from '@remix-run/react';
import styles from './styles.module.scss';

interface ILogoProps {
    to?: string;
}
export function Logo({ to }: ILogoProps) {
    const { colorScheme } = useMantineColorScheme();
    return (
        <Link className={styles.link} to={to || '/'}>
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

export function LogoSide({ to }: ILogoProps) {
    const { colorScheme } = useMantineColorScheme();
    return (
        <Link to={to || '/'}>
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
