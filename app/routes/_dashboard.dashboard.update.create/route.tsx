import {
    ActionIcon,
    Button,
    Divider,
    Flex,
    Loader,
    NativeSelect,
    Title,
    rem,
} from '@mantine/core';
import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useFetcher, useSearchParams } from '@remix-run/react';
import { IconPlus } from '@tabler/icons-react';
import { StatusCodes } from 'http-status-codes';
import { ChangeEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { serverOnly$ } from 'vite-env-only';
import { DefaultMode, UpdateServices } from '~/consts/update';
import { VersionType } from '~/proto/nextmu/v1/VersionType';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';

const requiredRole = serverOnly$('update:edit');

export async function loader({ request }: LoaderFunctionArgs) {
    const accessToken = await getAccessToken(request);
    if (accessToken == null) {
        return redirectToLogin(request);
    }

    const user = await getPublicUserInfoFromSession(request);
    if (user != null && !('roles' in user)) return user;
    if (user == null) {
        return redirectToLogin(request);
    }
    if (user.roles.includes(requiredRole!) === false) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    return json({});
}

export async function action({ request }: ActionFunctionArgs) {
    const accessToken = await getAccessToken(request);
    if (accessToken == null) {
        return redirectToLogin(request);
    }

    const user = await getPublicUserInfoFromSession(request);
    if (user != null && !('roles' in user)) return user;
    if (user == null) {
        return redirectToLogin(request);
    }
    if (user.roles.includes(requiredRole!) === false) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    return json({});
}

interface IVersionType {
    value: string;
    label: string;
}
const VersionTypes: IVersionType[] = [
    {
        value: VersionType.REVISION.toString(),
        label: 'dashboard.updates.version-type.revision',
    },
    {
        value: VersionType.MINOR.toString(),
        label: 'dashboard.updates.version-type.minor',
    },
    {
        value: VersionType.MAJOR.toString(),
        label: 'dashboard.updates.version-type.major',
    },
];

export default function Page() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher<typeof action>();

    const onModeSelect = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            setSearchParams((prev) => {
                prev.set('mode', event.currentTarget.value);
                return prev;
            });
        },
        [searchParams, setSearchParams],
    );

    const mode = useMemo(
        () => searchParams.get('mode') ?? DefaultMode,
        [searchParams, setSearchParams],
    );

    const onSubmit = useCallback(() => {
        fetcher.submit(
            {},
            {
                encType: 'application/json',
            },
        );
    }, [fetcher]);

    return (
        <Flex className="grow p-[12px]" direction="column">
            <Flex
                direction="row"
                justify="space-between"
                align="center"
                wrap="wrap"
            >
                <Title className="select-none" order={4}>
                    {t('dashboard.updates.title')}
                </Title>
                <Flex direction="row" align="center" gap={rem(12)}>
                    <NativeSelect
                        value={mode}
                        data={UpdateServices.map((v) => ({
                            value: v.value,
                            label: t(v.label),
                        }))}
                        onChange={onModeSelect}
                    />
                    <Link
                        className="flex justify-center items-center"
                        to="/dashboard/update/create"
                    >
                        <ActionIcon>
                            <IconPlus
                                style={{ width: rem(22), height: rem(22) }}
                                stroke={1.5}
                            />
                        </ActionIcon>
                    </Link>
                </Flex>
            </Flex>
            <Divider className="my-[10px]" />
            <Flex className="grow" direction="column" gap={rem(8)}>
                <fetcher.Form
                    className="flex flex-grow flex-col justify-between gap-[12px]"
                    onSubmit={onSubmit}
                >
                    <Flex className="gap-[12px]" direction="column">
                        <NativeSelect
                            name="type"
                            label={t('dashboard.updates.create.type.label')}
                            data={VersionTypes.map((v) => ({
                                value: v.value,
                                label: t(v.label),
                            }))}
                        />
                    </Flex>
                    <Button
                        className="self-end"
                        type="submit"
                        disabled={fetcher.state !== 'idle'}
                    >
                        {fetcher.state !== 'idle' && <Loader />}
                        {t('dashboard.updates.create.create.label')}
                    </Button>
                </fetcher.Form>
            </Flex>
        </Flex>
    );
}
