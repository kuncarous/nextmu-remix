import {
    ActionIcon,
    Divider,
    Flex,
    NativeSelect,
    Title,
    rem,
} from '@mantine/core';
import {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    TypedResponse,
    json,
} from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { IconPlus } from '@tabler/icons-react';
import { ObjectId } from 'bson';
import { StatusCodes } from 'http-status-codes';
import { ChangeEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { serverOnly$ } from 'vite-env-only/macros';
import { z } from 'zod';
import {
    DefaultMode,
    UpdateAction,
    UpdateServices,
    ZUpdateAction,
    getUpdateService,
} from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import {
    fetchUploads,
    getVersionsList,
    publishVersion,
} from '~/services/grpc/update.server';
import {
    parseGrpcErrorIntoJsonResponse,
    parseGrpcErrorIntoResponse,
} from '~/utils/grpc.server';
import { RequiredNonNullable } from '~/utils/types';
import { EmptyVersionList } from './components/empty-version-list';
import { VersionCard } from './components/version-card';

const requiredRole = serverOnly$('update:view');

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
    if (user.roles.includes(requiredRole!) == false) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || DefaultMode;
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

    const versions = await getVersionsList(
        parsed.data.page,
        parsed.data.size,
        await getUpdateService!(mode),
        accessToken,
    );
    if (versions[0]) {
        throw parseGrpcErrorIntoResponse(versions[0]);
    }

    const uploads = await fetchUploads(
        versions[1].versions.map((v) => v.id),
        await getUpdateService!(mode),
        accessToken,
    );
    if (uploads[0]) {
        throw parseGrpcErrorIntoResponse(uploads[0]);
    }

    return {
        ...versions[1],
        ...uploads[1],
    };
}
type LoaderReturnType = Exclude<
    Awaited<ReturnType<typeof loader>>,
    TypedResponse
>;
type LoaderType = Promise<
    Omit<LoaderReturnType, 'version'> &
        RequiredNonNullable<Pick<LoaderReturnType, 'versions'>>
>;

export default function Page() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const data = useLoaderData<LoaderType>();
    const uploads = useMemo(
        () => new Map((data.uploads ?? []).map((u) => [u.versionId!, u])),
        [data.uploads ?? []],
    );

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
                        to={`/dashboard/update/${mode}/create`}
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
            <Divider className="my-2.5" />
            <Flex className="grow" direction="row" gap={rem(8)}>
                {(data?.versions.length ?? 0) === 0 && <EmptyVersionList />}
                {data != null &&
                    data.versions.map((version) => (
                        <VersionCard
                            key={version.id}
                            version={version}
                            upload={uploads.get(version.id)}
                        />
                    ))}
            </Flex>
        </Flex>
    );
}

export const ZPublishVersion = z.object({
    action: ZUpdateAction,
    versionId: z.string().refine((value) => ObjectId.isValid(value)),
});
export type IPublishVersion = z.infer<typeof ZPublishVersion>;

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

    const parsed = ZPublishVersion.safeParse(await request.json());
    if (parsed.success === false) {
        return json(
            {
                error: parsed.error.format(),
            },
            StatusCodes.BAD_REQUEST,
        );
    }

    if (parsed.data.action !== UpdateAction.Publish) {
        return json(
            {
                error: `invalid action`,
            },
            StatusCodes.BAD_REQUEST,
        );
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || DefaultMode;
    const updateService = await getUpdateService!(mode);
    if (updateService == null) {
        throw new Response(null, {
            status: StatusCodes.SERVICE_UNAVAILABLE,
            statusText: 'Service Unavailable',
        });
    }

    const [error, response] = await publishVersion(
        parsed.data.versionId,
        updateService,
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return response;
}
