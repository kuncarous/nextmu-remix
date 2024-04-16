import { Title, Tooltip, UnstyledButton, rem } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Location, useLocation, useNavigate } from '@remix-run/react';
import {
    Icon,
    IconChevronLeft,
    IconChevronRight,
    IconMoon,
    IconProps,
    IconRefresh,
    IconSun,
} from '@tabler/icons-react';
import classNames from 'classnames';
import {
    ForwardRefExoticComponent,
    ReactNode,
    RefAttributes,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Translation, useTranslation } from 'react-i18next';
import { useIsomorphicLayoutEffect, useOnClickOutside } from 'usehooks-ts';
import { Logo } from '~/components/logo';
import { useUserInfo } from '~/providers/auth';
import { useToggleTheme } from '~/utils/theme';
import { UserMenu } from './components/usermenu';
import styles from './styles.module.scss';

interface ILink {
    key: string;
    label: ReactNode;
    roles?: RegExp;
    checkActive: (location: Location) => boolean;
    to: string;
}

interface IMainLinkBase {
    key: string;
    icon: ForwardRefExoticComponent<
        Omit<IconProps, 'ref'> & RefAttributes<Icon>
    >;
    title: ReactNode;
    label: ReactNode;
    roles?: RegExp;
    checkActive: (location: Location) => boolean;
}

type IMainLink = IMainLinkBase &
    (
        | {
              to: string;
              links?: undefined;
          }
        | {
              to?: undefined;
              links: ILink[];
          }
    );

const MainLinks: IMainLink[] = [
    {
        key: 'dashboard.update',
        icon: IconRefresh,
        title: (
            <Translation>{(t) => t('dashboard.menu.update.title')}</Translation>
        ),
        label: (
            <Translation>{(t) => t('dashboard.menu.update.label')}</Translation>
        ),
        roles: /^update\:.*$/,
        checkActive: (location) =>
            /^\/dashboard\/update(\/.*)?/.test(location.pathname),
        links: [
            {
                key: 'dashboard.update.list',
                label: (
                    <Translation>
                        {(t) => t('dashboard.menu.update.list.label')}
                    </Translation>
                ),
                roles: /^(?:update:view|update:edit)$/,
                checkActive: (location) =>
                    location.pathname === '/dashboard/update/list',
                to: '/dashboard/update/list',
            },
        ],
    },
];

function ThemeSwitch() {
    const { t } = useTranslation();
    const { toggleTheme } = useToggleTheme();

    return (
        <>
            <Tooltip
                label={t('theme.toggle.label')}
                position="right"
                withArrow
                transitionProps={{ duration: 0 }}
            >
                <UnstyledButton
                    onClick={toggleTheme}
                    className={styles.mainLink}
                >
                    <IconSun
                        className={classNames(styles.light)}
                        style={{ width: rem(22), height: rem(22) }}
                        stroke={1.5}
                    />
                    <IconMoon
                        className={classNames(styles.dark)}
                        style={{ width: rem(22), height: rem(22) }}
                        stroke={1.5}
                    />
                </UnstyledButton>
            </Tooltip>
        </>
    );
}

export function Navbar() {
    const userInfo = useUserInfo();
    const { t } = useTranslation();
    const navbarRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState<IMainLink | undefined>(
        MainLinks.find((m) => m.checkActive(location)),
    );
    const matches = useMediaQuery(
        `(min-width: ${styles.mantineBreakpointMd.replaceAll('"', '')})`,
        true,
    );

    useIsomorphicLayoutEffect(() => {
        if (matches) setOpen(false);
    }, [matches]);

    const toggleMenu = useCallback(() => {
        setOpen(!open);
    }, [open]);

    useOnClickOutside(navbarRef, () => setOpen(false));

    const mainLinks = useMemo(() => {
        if (userInfo == null) return [];
        return MainLinks.filter((link) => {
            if (link.roles == null) return true;
            let found = false;
            for (const role of userInfo.roles) {
                found = link.roles.test(role);
                if (found) break;
            }
            return found;
        });
    }, [userInfo]);

    const links = useMemo(() => {
        if (userInfo == null || active?.links == null) return [];
        return active.links.filter((link) => {
            if (link.roles == null) return true;
            let found = false;
            for (const role of userInfo.roles) {
                found = link.roles.test(role);
                if (found) break;
            }
            return found;
        });
    }, [userInfo, active]);

    if (userInfo == null) return null;

    return (
        <div className={styles.navbarWrapper}>
            <nav
                ref={navbarRef}
                className={classNames(styles.navbar, {
                    [styles.navbarOpen]: open,
                })}
            >
                <div className={styles.header}>
                    <div
                        className={classNames(styles.headerAside, {
                            [styles.headerAsideOpen]: open,
                        })}
                    >
                        <div className={styles.logo}>
                            <Logo to="#" />
                        </div>
                    </div>
                    <div
                        className={classNames(styles.headerMain, {
                            [styles.headerMainOpen]: open,
                        })}
                    >
                        <Title
                            order={4}
                            className={classNames(styles.title, {
                                [styles.titleOpen]: open,
                            })}
                        >
                            {active?.title || ''}
                        </Title>
                        {!matches && (
                            <Tooltip
                                label={
                                    !open
                                        ? t('dashboard.menu.open.label')
                                        : t('dashboard.menu.close.label')
                                }
                                position="right"
                                withArrow
                                transitionProps={{ duration: 0 }}
                            >
                                <UnstyledButton
                                    onClick={toggleMenu}
                                    className={styles.menuButton}
                                    data-active={open}
                                >
                                    {!open && (
                                        <IconChevronRight
                                            style={{
                                                width: rem(22),
                                                height: rem(22),
                                            }}
                                            stroke={1.5}
                                        />
                                    )}
                                    {!!open && (
                                        <IconChevronLeft
                                            style={{
                                                width: rem(22),
                                                height: rem(22),
                                            }}
                                            stroke={1.5}
                                        />
                                    )}
                                </UnstyledButton>
                            </Tooltip>
                        )}
                    </div>
                </div>
                <div className={styles.wrapper}>
                    <div className={styles.asideWrapper}>
                        <div className={styles.aside}>
                            {mainLinks.map((link) => {
                                return (
                                    <Tooltip
                                        key={link.key}
                                        label={link.label}
                                        position="right"
                                        withArrow
                                        transitionProps={{ duration: 0 }}
                                    >
                                        <UnstyledButton
                                            onClick={() => {
                                                if (!!link.to) {
                                                    navigate(link.to);
                                                } else {
                                                    setOpen(true);
                                                    setActive(link);
                                                }
                                            }}
                                            className={styles.mainLink}
                                            data-active={
                                                active?.key === link.key ||
                                                undefined
                                            }
                                        >
                                            <link.icon
                                                style={{
                                                    width: rem(22),
                                                    height: rem(22),
                                                }}
                                                stroke={1.5}
                                            />
                                        </UnstyledButton>
                                    </Tooltip>
                                );
                            })}
                        </div>
                        <div className={styles.asideBottom}>
                            <ThemeSwitch />
                            <UserMenu />
                        </div>
                    </div>
                    <div
                        className={classNames(styles.main, {
                            [styles.mainOpen]: open,
                        })}
                    >
                        {links.map((link) => {
                            return (
                                <span
                                    key={link.key}
                                    className={styles.link}
                                    data-active={
                                        link.checkActive(location) || undefined
                                    }
                                    onClick={() => {
                                        setOpen(false);
                                        navigate(link.to);
                                    }}
                                >
                                    {link.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
}
