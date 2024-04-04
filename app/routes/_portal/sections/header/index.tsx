import {
    Anchor,
    Box,
    Burger,
    Button,
    Center,
    Collapse,
    Divider,
    Drawer,
    Group,
    HoverCard,
    ScrollArea,
    SimpleGrid,
    Text,
    ThemeIcon,
    UnstyledButton,
    rem,
    useComputedColorScheme,
    useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from '@remix-run/react';
import { RemixIcon } from '~/components/remixicon';
import styles from './styles.module.scss';

interface ILinkButtonProps {
    icon: string;
    title: string;
    description: string;
}

const mockdata: ILinkButtonProps[] = [
    {
        icon: 'ri-code-s-slash-line',
        title: 'Open source',
        description: 'This Pokémon’s cry is very loud and distracting',
    },
    {
        icon: 'ri-money-dollar-circle-line',
        title: 'Free for everyone',
        description: 'The fluid of Smeargle’s tail secretions changes',
    },
    {
        icon: 'ri-book-open-line',
        title: 'Documentation',
        description: 'Yanma is capable of seeing 360 degrees without',
    },
    {
        icon: 'ri-fingerprint-line',
        title: 'Security',
        description: 'The shell’s rounded shape and the grooves on its.',
    },
    {
        icon: 'ri-pie-chart-2-line',
        title: 'Analytics',
        description: 'This Pokémon uses its flying ability to quickly chase',
    },
    {
        icon: 'ri-notification-badge-line',
        title: 'Notifications',
        description: 'Combusken battles with the intensely hot flames it spews',
    },
];

/*export default function Header() {
    const colorScheme = useComputedColorScheme('light');
    const isMobile = useMediaQuery('(max-width: 600px)');

    return (
        <>
            <header className={styles.header}>
                <Group align="center" justify="space-between" h="100%">
                    <Group align="center" justify="flex-end" pr={16}>
                        <ThemeSwitch />
                    </Group>
                </Group>
            </header>
        </>
    );
}*/

function LinkButton(props: ILinkButtonProps) {
    const theme = useMantineTheme();
    return (
        <UnstyledButton className={styles.subLink} key={props.title}>
            <Group wrap="nowrap" align="flex-start">
                <ThemeIcon size={34} variant="default" radius="md">
                    <RemixIcon
                        icon={props.icon}
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

export default function Header() {
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
        useDisclosure(false);
    const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
    const theme = useMantineTheme();
    const colorScheme = useComputedColorScheme('light');

    const links = mockdata.map((item, index) => (
        <LinkButton key={index} {...item} />
    ));

    return (
        <Box pb={120}>
            <header className={styles.header}>
                <Group justify="space-between" h="100%">
                    <Link to="/">
                        <img
                            className={styles.logo}
                            src={
                                colorScheme === 'dark'
                                    ? '/images/nextmu_white.png'
                                    : '/images/nextmu_black.png'
                            }
                        />
                    </Link>

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
                                    <Center inline>
                                        <Box component="span" mr={5}>
                                            Features
                                        </Box>
                                        <RemixIcon
                                            icon="ri-arrow-right-s-line"
                                            size={rem(16)}
                                            color={theme.colors.blue[6]}
                                        />
                                    </Center>
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

                    <Group visibleFrom="sm">
                        <Button variant="default">Log in</Button>
                        <Button>Sign up</Button>
                    </Group>

                    <Burger
                        opened={drawerOpened}
                        onClick={toggleDrawer}
                        hiddenFrom="sm"
                    />
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
                            <RemixIcon
                                icon="ri-arrow-right-s-line"
                                size={rem(16)}
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

                    <Group justify="center" grow pb="xl" px="md">
                        <Button variant="default">Log in</Button>
                        <Button>Sign up</Button>
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}
