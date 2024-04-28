import {
    ActionIcon,
    Divider,
    Flex,
    NativeSelect,
    Title,
    rem,
} from '@mantine/core';
import { LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { IconPlus } from '@tabler/icons-react';
import { StatusCodes } from 'http-status-codes';
import { ChangeEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import {
    getGameUpdateService,
    getVersionsList,
} from '~/services/grpc/update.server';
import { hasDashboardRoles } from '~/utils/dashboard';
import { parseGrpcErrorIntoResponse } from '~/utils/grpc.server';
import { EmptyVersionList } from './components/empty-version-list';
import { VersionCard } from './components/version-card';

interface IUpdateService {
    value: string;
    label: string;
}

const DefaultMode: string = 'game';
const UpdateServices: IUpdateService[] = [
    {
        value: 'game',
        label: 'dashboard.updates.select-service.game',
    },
    {
        value: 'launcher',
        label: 'dashboard.updates.select-service.launcher',
    },
];

const ZListVersions = z.object({
    page: z.coerce.number().int().min(0).default(0),
    size: z.coerce.number().int().multipleOf(5).min(5).max(50).default(5),
});

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
    if (hasDashboardRoles(user) == false) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    const url = new URL(request.url);
    const parsed = ZListVersions.safeParse({
        page: url.searchParams.get('page') ?? undefined,
        size: url.searchParams.get('size') ?? undefined,
    });
    if (!parsed.success) {
        throw new Response(null, {
            status: StatusCodes.BAD_REQUEST,
            statusText: 'bad request, input has invalid format',
        });
    }

    const [error, response] = await getVersionsList(
        parsed.data.page,
        parsed.data.size,
        await getGameUpdateService(),
        accessToken,
    );
    if (error) {
        throw new Response(null, parseGrpcErrorIntoResponse(error));
    }

    return json(response);
}

export default function Page() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const data = useLoaderData<typeof loader>();

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

    return (
        <Flex className="grow p-[12px]" direction="column">
            <Flex
                direction="row"
                justify="space-between"
                align="center"
                wrap="wrap"
            >
                <Title order={4}>{t('dashboard.updates.title')}</Title>
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
            <Flex className="grow" direction="row" gap={rem(8)}>
                {(data?.versions.length ?? 0) === 0 && <EmptyVersionList />}
                {data != null &&
                    data.versions.map((version) => <VersionCard key={version.id} version={version} />)}
            </Flex>
        </Flex>
    );
}
