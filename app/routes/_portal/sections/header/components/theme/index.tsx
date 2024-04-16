import { ActionIcon } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import classNames from 'classnames';
import { useToggleTheme } from '~/utils/theme';
import styles from './styles.module.scss';

export function ThemeSwitch() {
    const { toggleTheme } = useToggleTheme();

    return (
        <>
            <ActionIcon
                onClick={toggleTheme}
                variant="default"
                size={36}
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
