import { Button, Divider, Flex, Loader, rem } from '@mantine/core';
import {
    ActionFunctionArgs,
    LinksFunction,
    LoaderFunctionArgs,
    TypedResponse,
} from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { StatusCodes } from 'http-status-codes';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { serverOnly$ } from 'vite-env-only/macros';
import { UpdateStepper, UpdateSteps } from '~/components/update-stepper';
import { UpdateServices, getUpdateService } from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import {
    fetchUploads,
    fetchVersion,
    publishVersion,
} from '~/services/grpc/update.server';
import { parseGrpcErrorIntoJsonResponse } from '~/utils/grpc.server';

import mantineTiptapStyles from '@mantine/tiptap/styles.css?url';
import { ClientOnly } from 'remix-utils/client-only';

import { ObjectId } from 'mongodb';
import { RequiredNonNullable } from '~/utils/types';

const requiredRole = serverOnly$('update:edit');

export const links: LinksFunction = () => [
    { rel: 'stylesheet', href: mantineTiptapStyles },
];

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { mode, versionId } = params;
    if (
        !mode ||
        UpdateServices.find((s) => s.value === mode) == null ||
        versionId == null ||
        ObjectId.isValid(versionId) == false
    ) {
        throw new Response(null, {
            status: StatusCodes.NOT_FOUND,
            statusText: 'Not Found',
        });
    }

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

    const updateService = await getUpdateService!(mode);
    if (updateService == null) {
        throw new Response(null, {
            status: StatusCodes.SERVICE_UNAVAILABLE,
            statusText: 'Service Unavailable',
        });
    }

    const version = await fetchVersion(versionId, updateService, accessToken);
    if (version[0]) {
        return parseGrpcErrorIntoJsonResponse(version[0]);
    }

    const uploads = await fetchUploads([versionId], updateService, accessToken);
    if (uploads[0]) {
        return parseGrpcErrorIntoJsonResponse(uploads[0]);
    }

    return {
        version: version[1].version,
        upload: uploads[1].uploads?.[0],
    };
}
type LoaderReturnType = Exclude<
    Awaited<ReturnType<typeof loader>>,
    TypedResponse
>;
type LoaderType = Promise<
    Omit<LoaderReturnType, 'version'> &
        RequiredNonNullable<Pick<LoaderReturnType, 'version'>>
>;

export async function action({ request, params }: ActionFunctionArgs) {
    const { mode, versionId } = params;
    if (
        !mode ||
        UpdateServices.find((s) => s.value === mode) == null ||
        versionId == null ||
        ObjectId.isValid(versionId) == false
    ) {
        throw new Response(null, {
            status: StatusCodes.NOT_FOUND,
            statusText: 'Not Found',
        });
    }

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

    const updateService = await getUpdateService!(mode);
    if (updateService == null) {
        throw new Response(null, {
            status: StatusCodes.SERVICE_UNAVAILABLE,
            statusText: 'Service Unavailable',
        });
    }

    const [error] = await publishVersion(
        versionId,
        await getUpdateService!(mode),
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return {};
}

function ClientOnlyPage() {
    const { t } = useTranslation();
    const { version } = useLoaderData<LoaderType>();
    const fetcher = useFetcher<typeof action>();

    const onSubmit = useCallback(() => {
        fetcher.submit(
            {},
            {
                encType: 'application/json',
                method: 'post',
            },
        );
    }, [fetcher]);

    return (
        <Flex className="grow p-4" direction="column">
            <div className="flex flex-col px-8 pt-4 w-full">
                <UpdateStepper currentStep={UpdateSteps.Publish} />
            </div>
            <Flex className="grow mt-16" direction="column" gap={rem(8)}>
                <Flex className="flex flex-grow flex-col justify-between gap-3">
                    <Flex
                        className="gap-3 grow self-center justify-center w-[48rem] max-w-[80vw]"
                        direction="column"
                    >
                        <span className="text-center text-xl">
                            {t('dashboard.updates.upload.publish.text', {
                                version: version.version,
                            })}
                        </span>
                    </Flex>
                    <Divider className="my-2" />
                    <Button
                        className="self-end"
                        type="submit"
                        disabled={fetcher.state !== 'idle'}
                        onClick={onSubmit}
                    >
                        {fetcher.state !== 'idle' && (
                            <Loader className="mr-2" size="xs" />
                        )}
                        {t('dashboard.updates.publish.publish.label')}
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default function Page() {
    return (
        <ClientOnly
            fallback={
                <div className="flex grow flex-col justify-center items-center">
                    <Loader />
                </div>
            }
        >
            {() => <ClientOnlyPage />}
        </ClientOnly>
    );
}
