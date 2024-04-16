import { Avatar, Menu, UnstyledButton, rem } from '@mantine/core';
import { Link } from '@remix-run/react';
import {
    IconHome,
    IconLogout,
    IconSettings,
    IconSwitchHorizontal,
    IconUser,
} from '@tabler/icons-react';
import classNames from 'classnames';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserInfo } from '~/providers/auth';
import Arrays from '~/utils/array';
import styles from './styles.module.scss';

export function UserMenu() {
    const { t } = useTranslation();
    const [userMenuOpened, setUserMenuOpened] = useState(false);
    const user = useUserInfo();

    const general = useMemo(() => {
        const menu = [
            <Link key="general.back-home" to="/">
                <Menu.Item
                    leftSection={
                        <IconHome
                            style={{
                                width: rem(16),
                                height: rem(16),
                            }}
                            stroke={1.5}
                        />
                    }
                >
                    {t('user-menu.sections.general.back-home')}
                </Menu.Item>
            </Link>,
        ];

        return menu.length > 0
            ? [
                  <Menu.Label key="general">
                      {t('user-menu.sections.general.label')}
                  </Menu.Label>,
                  ...menu,
              ]
            : [];
    }, [user?.roles]);

    const settings = useMemo(() => {
        const menu = [
            <Menu.Item
                key="settings.account-settings"
                leftSection={
                    <IconSettings
                        style={{
                            width: rem(16),
                            height: rem(16),
                        }}
                        stroke={1.5}
                    />
                }
            >
                {t('user-menu.sections.settings.account-settings')}
            </Menu.Item>,
            <Link key="settings.change-account" to="/change-account" reloadDocument>
                <Menu.Item
                    key="settings.change-account"
                    leftSection={
                        <IconSwitchHorizontal
                            style={{
                                width: rem(16),
                                height: rem(16),
                            }}
                            stroke={1.5}
                        />
                    }
                >
                    {t('user-menu.sections.settings.change-account')}
                </Menu.Item>
            </Link>,
            <Link key="settings.logout" to="/logout" reloadDocument>
                <Menu.Item
                    leftSection={
                        <IconLogout
                            style={{
                                width: rem(16),
                                height: rem(16),
                            }}
                            stroke={1.5}
                        />
                    }
                >
                    {t('user-menu.sections.settings.logout')}
                </Menu.Item>
            </Link>,
        ];

        return menu.length > 0
            ? [
                  <Menu.Label key="settings">
                      {t('user-menu.sections.settings.label')}
                  </Menu.Label>,
                  ...menu,
              ]
            : [];
    }, [user?.roles]);

    const menus = Arrays.join(
        (index) => <Menu.Divider key={`separator.${index}`} />,
        general,
        settings,
    );

    return (
        <>
            {user != null && (
                <>
                    <Menu
                        width={260}
                        position="right-end"
                        transitionProps={{ transition: 'pop-bottom-left' }}
                        offset={{ mainAxis: 5, crossAxis: -20 }}
                        onClose={() => setUserMenuOpened(false)}
                        onOpen={() => setUserMenuOpened(true)}
                        withinPortal
                    >
                        <Menu.Target>
                            <UnstyledButton
                                className={classNames(styles.user, {
                                    [styles.userActive]: userMenuOpened,
                                })}
                            >
                                <Avatar
                                    alt={user.given_name}
                                    radius="xl"
                                    size={rem(22)}
                                >
                                    <IconUser />
                                </Avatar>
                            </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>{menus}</Menu.Dropdown>
                    </Menu>
                </>
            )}
        </>
    );
}
