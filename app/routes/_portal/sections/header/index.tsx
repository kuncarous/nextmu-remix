import {
    Anchor,
    Box,
    Burger,
    Button,
    Center,
    Collapse,
    Divider,
    Drawer,
    Flex,
    Group,
    HoverCard,
    ScrollArea,
    SimpleGrid,
    Text,
    ThemeIcon,
    UnstyledButton,
    rem,
    useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useHeadroom } from '@mantine/hooks';
import { Link } from '@remix-run/react';
import {
    IconBook,
    IconChartPie3,
    IconChevronDown,
    IconCode,
    IconCoin,
    IconFingerprint,
    IconNotification,
} from '@tabler/icons-react';
import classNames from 'classnames';
import { Logo } from '~/components/logo';
import { useUserInfo } from '~/providers/auth';
import { ThemeSwitch } from './components/theme';
import { UserMenu } from './components/usermenu';
import styles from './styles.module.scss';

interface ILinkButtonProps {
    icon: React.JSX.ElementType;
    title: string;
    description: string;
}

const mockdata = [
    {
        icon: IconCode,
        title: 'Open source',
        description: 'This Pokémon’s cry is very loud and distracting',
    },
    {
        icon: IconCoin,
        title: 'Free for everyone',
        description: 'The fluid of Smeargle’s tail secretions changes',
    },
    {
        icon: IconBook,
        title: 'Documentation',
        description: 'Yanma is capable of seeing 360 degrees without',
    },
    {
        icon: IconFingerprint,
        title: 'Security',
        description: 'The shell’s rounded shape and the grooves on its.',
    },
    {
        icon: IconChartPie3,
        title: 'Analytics',
        description: 'This Pokémon uses its flying ability to quickly chase',
    },
    {
        icon: IconNotification,
        title: 'Notifications',
        description: 'Combusken battles with the intensely hot flames it spews',
    },
];

function LinkButton(props: ILinkButtonProps) {
    const theme = useMantineTheme();
    return (
        <UnstyledButton className={styles.subLink} key={props.title}>
            <Group wrap="nowrap" align="flex-start">
                <ThemeIcon size={34} variant="default" radius="md">
                    <props.icon
                        style={{ width: rem(22), height: rem(22) }}
                        color={theme.colors.blue[6]}
                    />
                </ThemeIcon>
                <div>
                    <Text size="sm" fw={500}>
                        {props.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {props.description}
                    </Text>
                </div>
            </Group>
        </UnstyledButton>
    );
}

function RightButtons() {
    const user = useUserInfo();

    return (
        <>
            {user == null && (
                <>
                    <Link to="/login">
                        <Button variant="default" size="sm">
                            Log in
                        </Button>
                    </Link>
                    <Link to="/register">
                        <Button size="sm">Sign up</Button>
                    </Link>
                </>
            )}
        </>
    );
}

export function Header() {
    const pinned = useHeadroom({ fixedAt: 120 });
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
        useDisclosure(false);
    const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
    const theme = useMantineTheme();

    const links = mockdata.map((item, index) => (
        <LinkButton key={index} {...item} />
    ));

    return (
        <Box pb={60}>
            <header
                className={classNames(styles.header, {
                    [styles.headerHide]: !pinned,
                })}
            >
                <Group justify="space-between" h="100%">
                    <Logo />

                    <Group h="100%" gap={0} visibleFrom="sm">
                        <a href="#" className={styles.link}>
                            Home
                        </a>
                        <HoverCard
                            width={600}
                            position="bottom"
                            radius="md"
                            shadow="md"
                            withinPortal
                        >
                            <HoverCard.Target>
                                <a href="#" className={styles.link}>
                                    <Flex justify="center" align="flex-end">
                                        <Box component="span" mr={5}>
                                            Features
                                        </Box>
                                        <IconChevronDown
                                            style={{
                                                width: rem(16),
                                                height: rem(16),
                                            }}
                                            color={theme.colors.blue[6]}
                                        />
                                    </Flex>
                                </a>
                            </HoverCard.Target>

                            <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
                                <Group justify="space-between" px="md">
                                    <Text fw={500}>Features</Text>
                                    <Anchor href="#" fz="xs">
                                        View all
                                    </Anchor>
                                </Group>

                                <Divider my="sm" />

                                <SimpleGrid cols={2} spacing={0}>
                                    {links}
                                </SimpleGrid>

                                <div className={styles.dropdownFooter}>
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={500} fz="sm">
                                                Get started
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Their food sources have
                                                decreased, and their numbers
                                            </Text>
                                        </div>
                                        <Button variant="default">
                                            Get started
                                        </Button>
                                    </Group>
                                </div>
                            </HoverCard.Dropdown>
                        </HoverCard>
                        <a href="#" className={styles.link}>
                            Learn
                        </a>
                        <a href="#" className={styles.link}>
                            Academy
                        </a>
                    </Group>

                    <Group gap={5}>
                        <UserMenu />
                        <ThemeSwitch />

                        <Group gap={5} visibleFrom="sm">
                            <RightButtons />
                        </Group>

                        <Burger
                            opened={drawerOpened}
                            onClick={toggleDrawer}
                            hiddenFrom="sm"
                        />
                    </Group>
                </Group>
            </header>

            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="100%"
                padding="md"
                title="Navigation"
                hiddenFrom="sm"
                zIndex={1000000}
            >
                <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
                    <Divider my="sm" />

                    <a href="#" className={styles.link}>
                        Home
                    </a>
                    <UnstyledButton
                        className={styles.link}
                        onClick={toggleLinks}
                    >
                        <Center inline>
                            <Box component="span" mr={5}>
                                Features
                            </Box>
                            <IconChevronDown
                                style={{ width: rem(16), height: rem(16) }}
                                color={theme.colors.blue[6]}
                            />
                        </Center>
                    </UnstyledButton>
                    <Collapse in={linksOpened}>{links}</Collapse>
                    <a href="#" className={styles.link}>
                        Learn
                    </a>
                    <a href="#" className={styles.link}>
                        Academy
                    </a>

                    <Divider my="sm" />

                    <Group justify="space-between" pb="md" px="md">
                        <RightButtons />
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}
