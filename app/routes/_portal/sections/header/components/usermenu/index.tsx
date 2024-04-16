import { Avatar, Group, Menu, Text, UnstyledButton, rem } from '@mantine/core';
import { Link } from '@remix-run/react';
import {
    IconChevronDown,
    IconLayout,
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
import { hasDashboardRoles } from '~/utils/dashboard';
import styles from './styles.module.scss';

export function UserMenu() {
    const { t } = useTranslation();
    const [userMenuOpened, setUserMenuOpened] = useState(false);
    const user = useUserInfo();

    const dashboard = useMemo(() => {
        const menu = [
            ...(hasDashboardRoles(user)
                ? [
                      <Link key="dashboard.enter" to="/dashboard">
                          <Menu.Item
                              leftSection={
                                  <IconLayout
                                      style={{
                                          width: rem(16),
                                          height: rem(16),
                                      }}
                                      stroke={1.5}
                                  />
                              }
                          >
                              {t('user-menu.sections.dashboard.enter')}
                          </Menu.Item>
                      </Link>,
                  ]
                : []),
        ];

        return menu.length > 0
            ? [
                  <Menu.Label key="dashboard">
                      {t('user-menu.sections.dashboard.label')}
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
        dashboard,
        settings,
    );

    return (
        <>
            {user != null && (
                <>
                    <Menu
                        width={260}
                        position="bottom-end"
                        transitionProps={{ transition: 'pop-top-right' }}
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
                                <Group gap={7}>
                                    <Avatar
                                        alt={user.given_name}
                                        radius="xl"
                                        size={20}
                                    >
                                        <IconUser />
                                    </Avatar>
                                    <Group gap={3.5}>
                                        <Text fw={500} size="sm" lh={1} mr={3}>
                                            {user.given_name}
                                        </Text>
                                        <IconChevronDown
                                            style={{
                                                width: rem(12),
                                                height: rem(12),
                                                alignSelf: 'flex-end',
                                            }}
                                            stroke={1.5}
                                        />
                                    </Group>
                                </Group>
                            </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>{menus}</Menu.Dropdown>
                    </Menu>
                </>
            )}
        </>
    );
}
