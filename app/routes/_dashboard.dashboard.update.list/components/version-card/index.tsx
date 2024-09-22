import { Button, Card, Flex, Text } from '@mantine/core';
import type { Jsonify } from '@remix-run/server-runtime/dist/jsonify';
import { useTranslation } from 'react-i18next';
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
                    <Button fullWidth>
                        {t('dashboard.updates.list.version.publish.label')}
                    </Button>
                ) : (
                    <Button fullWidth disabled>
                        {t(
                            'dashboard.updates.list.version.publish.processing.label',
                        )}
                    </Button>
                )}
            </Card.Section>
        </Card>
    );
};
