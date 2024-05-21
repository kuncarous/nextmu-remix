import { Button, Divider, Flex, Loader, rem } from '@mantine/core';
import {
    ActionFunctionArgs,
    LinksFunction,
    LoaderFunctionArgs,
    json,
} from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { StatusCodes } from 'http-status-codes';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { serverOnly$ } from 'vite-env-only';
import { z } from 'zod';
import { UpdateStepper, UpdateSteps } from '~/components/update-stepper';
import { UpdateServices, getUpdateService } from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { editVersion, fetchVersion } from '~/services/grpc/update.server';
import {
    parseGrpcErrorIntoJsonResponse,
    parseGrpcErrorIntoResponse,
} from '~/utils/grpc.server';

import mantineTiptapStyles from '@mantine/tiptap/styles.css?url';
import { ClientOnly } from 'remix-utils/client-only';

import { Link, RichTextEditor } from '@mantine/tiptap';
import Highlight from '@tiptap/extension-highlight';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ObjectId } from 'mongodb';

const requiredRole = serverOnly$('update:edit');
const ZEditVersion = z.object({
    description: z.string().min(1, `description is too short or is missing.`),
});

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

    const [error, version] = await fetchVersion(
        versionId,
        updateService,
        accessToken,
    );
    if (error) {
        throw parseGrpcErrorIntoResponse(error);
    }

    return json(version);
}

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

    const parsed = ZEditVersion.safeParse(await request.json());
    if (parsed.success === false) {
        return json(
            {
                error: parsed.error.format(),
            },
            StatusCodes.BAD_REQUEST,
        );
    }

    const [error, response] = await editVersion(
        versionId,
        parsed.data.description,
        await getUpdateService!(mode),
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    if (response == null) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    return json(response);
}

function ClientOnlyPage() {
    const { t } = useTranslation();
    const data = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Superscript,
            SubScript,
            Highlight,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: data?.version?.description ?? '',
    });

    const onSubmit = useCallback(() => {
        fetcher.submit(
            {
                description: JSON.stringify(editor?.getJSON() || ''),
            },
            {
                encType: 'application/json',
                method: 'post',
            },
        );
    }, [editor, fetcher]);

    return (
        <Flex className="grow p-4" direction="column">
            <div className="flex flex-col px-8 pt-4 w-full">
                <UpdateStepper currentStep={UpdateSteps.Edit} />
            </div>
            <Flex className="grow mt-16" direction="column" gap={rem(8)}>
                <Flex className="flex flex-grow flex-col justify-between gap-3">
                    <Flex
                        className="gap-3 grow self-center w-[48rem] max-w-[80vw]"
                        direction="column"
                    >
                        <span className="text-sm">
                            {t('dashboard.updates.create.description.label')}
                        </span>
                        <RichTextEditor
                            className="flex flex-col grow"
                            editor={editor}
                        >
                            <RichTextEditor.Toolbar sticky stickyOffset={60}>
                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Bold />
                                    <RichTextEditor.Italic />
                                    <RichTextEditor.Underline />
                                    <RichTextEditor.Strikethrough />
                                    <RichTextEditor.ClearFormatting />
                                    <RichTextEditor.Highlight />
                                    <RichTextEditor.Code />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.H1 />
                                    <RichTextEditor.H2 />
                                    <RichTextEditor.H3 />
                                    <RichTextEditor.H4 />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Blockquote />
                                    <RichTextEditor.Hr />
                                    <RichTextEditor.BulletList />
                                    <RichTextEditor.OrderedList />
                                    <RichTextEditor.Subscript />
                                    <RichTextEditor.Superscript />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Link />
                                    <RichTextEditor.Unlink />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.AlignLeft />
                                    <RichTextEditor.AlignCenter />
                                    <RichTextEditor.AlignJustify />
                                    <RichTextEditor.AlignRight />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Undo />
                                    <RichTextEditor.Redo />
                                </RichTextEditor.ControlsGroup>
                            </RichTextEditor.Toolbar>

                            <RichTextEditor.Content className="flex flex-col grow [&_.mantine-RichTextEditor-content]:flex [&_.mantine-RichTextEditor-content]:flex-col [&_.mantine-RichTextEditor-content]:grow [&_.tiptap]:grow" />
                        </RichTextEditor>
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
                        {t('dashboard.updates.create.create.label')}
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
