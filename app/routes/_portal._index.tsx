import type { MetaFunction } from '@remix-run/cloudflare';
import { useTranslation } from 'react-i18next';

export const meta: MetaFunction = () => {
    const { t } = useTranslation();
    return [
        { title: t('title') },
        { name: 'description', content: t('description') },
    ];
};

export default function Index() {
    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
            <h1>Welcome to Remix</h1>
            <ul>
                <li>
                    <a
                        target="_blank"
                        href="https://remix.run/tutorials/blog"
                        rel="noreferrer"
                    >
                        15m Quickstart Blog Tutorial
                    </a>
                </li>
                <li>
                    <a
                        target="_blank"
                        href="https://remix.run/tutorials/jokes"
                        rel="noreferrer"
                    >
                        Deep Dive Jokes App Tutorial
                    </a>
                </li>
                <li>
                    <a
                        target="_blank"
                        href="https://remix.run/docs"
                        rel="noreferrer"
                    >
                        Remix Docs
                    </a>
                </li>
            </ul>
        </div>
    );
}
