import { ActionIcon, Container, Group, Text, rem } from '@mantine/core';
import {
    IconBrandInstagram,
    IconBrandTwitter,
    IconBrandYoutube,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LogoSide } from '~/components/logo';
import { CopyrightCurrentYear, CopyrightFirstYear } from '~/consts/copyright';
import styles from './styles.module.scss';

const data = [
    {
        title: 'About',
        links: [
            { label: 'Features', link: '#' },
            { label: 'Pricing', link: '#' },
            { label: 'Support', link: '#' },
            { label: 'Forums', link: '#' },
        ],
    },
    {
        title: 'Project',
        links: [
            { label: 'Contribute', link: '#' },
            { label: 'Media assets', link: '#' },
            { label: 'Changelog', link: '#' },
            { label: 'Releases', link: '#' },
        ],
    },
    {
        title: 'Community',
        links: [
            { label: 'Join Discord', link: '#' },
            { label: 'Follow on Twitter', link: '#' },
            { label: 'Email newsletter', link: '#' },
            { label: 'GitHub discussions', link: '#' },
        ],
    },
];

export function Footer() {
    const { t } = useTranslation();

    const groups = data.map((group) => {
        const links = group.links.map((link, index) => (
            <Text<'a'>
                key={index}
                className={styles.link}
                component="a"
                href={link.link}
                onClick={(event) => event.preventDefault()}
            >
                {link.label}
            </Text>
        ));

        return (
            <div className={styles.wrapper} key={group.title}>
                <Text className={styles.title}>{group.title}</Text>
                {links}
            </div>
        );
    });

    return (
        <footer className={styles.footer}>
            <Container className={styles.inner}>
                <div className={styles.logo}>
                    <LogoSide />
                    <Text size="xs" c="dimmed" className={styles.description}>
                        {t('footer.message')}
                    </Text>
                </div>
                <div className={styles.groups}>{groups}</div>
            </Container>
            <Container className={styles.afterFooter}>
                <Text c="dimmed" size="sm">
                    {t('footer.copyright', {
                        firstYear: CopyrightFirstYear,
                        currentYear: CopyrightCurrentYear,
                    })}
                </Text>

                <Group
                    gap={0}
                    className={styles.social}
                    justify="flex-end"
                    wrap="nowrap"
                >
                    <ActionIcon size="lg" color="gray" variant="subtle">
                        <IconBrandTwitter
                            style={{ width: rem(18), height: rem(18) }}
                            stroke={1.5}
                        />
                    </ActionIcon>
                    <ActionIcon size="lg" color="gray" variant="subtle">
                        <IconBrandYoutube
                            style={{ width: rem(18), height: rem(18) }}
                            stroke={1.5}
                        />
                    </ActionIcon>
                    <ActionIcon size="lg" color="gray" variant="subtle">
                        <IconBrandInstagram
                            style={{ width: rem(18), height: rem(18) }}
                            stroke={1.5}
                        />
                    </ActionIcon>
                </Group>
            </Container>
        </footer>
    );
}
