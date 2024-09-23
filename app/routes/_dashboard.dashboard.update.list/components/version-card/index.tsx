import { Button, Card, Flex, Loader, Text } from '@mantine/core';
import { useFetcher } from '@remix-run/react';
import type { Jsonify } from '@remix-run/server-runtime/dist/jsonify';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UpdateAction } from '~/consts/update';
import { Upload } from '~/proto/nextmu/v1/Upload';
import { UploadState } from '~/proto/nextmu/v1/UploadState';
import type { Version__Output as Version } from '~/proto/nextmu/v1/Version';
import { VersionState } from '~/proto/nextmu/v1/VersionState';

interface IVersionCardProps {
    version: Jsonify<Version>;
    upload?: Jsonify<Upload>;
}
export const VersionCard = ({ version, upload }: IVersionCardProps) => {
    const { t } = useTranslation();
    const fetcher = useFetcher();

    const onSubmit = useCallback(() => {
        fetcher.submit(
            {
                action: UpdateAction.Publish,
                versionId: version.id,
            },
            {
                encType: 'application/json',
                method: 'post',
            },
        );
    }, [fetcher]);

    return (
        <Card
            className="self-start"
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            miw={240}
            mih={300}
        >
            <Card.Section withBorder inheritPadding py="xs">
                <Text size="lg" fw={500}>
                    v{version.version}
                </Text>
            </Card.Section>
            <Flex className="flex-grow" direction="column"></Flex>
            <Card.Section inheritPadding mt="sm" pb="md">
                {version.state === VersionState.READY ? (
                    <Button fullWidth disabled>
                        {t('dashboard.updates.list.version.ready.label')}
                    </Button>
                ) : upload == null || upload.state === UploadState.NONE ? (
                    <Button fullWidth>
                        {t('dashboard.updates.list.version.upload.label')}
                    </Button>
                ) : upload.state === UploadState.READY &&
                  version.state === VersionState.PENDING ? (
                    <Button
                        fullWidth
                        onClick={onSubmit}
                        disabled={fetcher.state !== 'idle'}
                    >
                        {fetcher.state !== 'idle' && (
                            <Loader className="mr-2" size="xs" />
                        )}
                        {t('dashboard.updates.list.version.publish.label')}
                    </Button>
                ) : (
                    <Button fullWidth disabled>
                        <Loader className="mr-2" size="xs" />
                        {t('dashboard.updates.list.version.processing.label')}
                    </Button>
                )}
            </Card.Section>
        </Card>
    );
};
