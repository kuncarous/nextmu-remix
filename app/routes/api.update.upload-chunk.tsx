import { ActionFunctionArgs, json } from '@remix-run/node';
import { StatusCodes } from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { serverOnly$ } from 'vite-env-only';
import { z } from 'zod';
import { ZValidUpdateServiceMode, getUpdateService } from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { uploadVersionChunk } from '~/services/grpc/update.server';
import { parseGrpcErrorIntoJsonResponse } from '~/utils/grpc.server';

const requiredRole = serverOnly$('update:edit');

const ZUploadVersionChunkBase = z.object({
    mode: ZValidUpdateServiceMode,
    uploadId: z.string().refine((value) => ObjectId.isValid(value)),
    concurrentId: z.string().refine((value) => ObjectId.isValid(value)),
    offset: z.coerce.number().int().min(0),
});
export const ZUploadVersionChunk = ZUploadVersionChunkBase.extend({
    data: z
        .string()
        .base64()
        .transform((value) => Buffer.from(value, 'base64')),
});
export type IUploadVersionChunk = z.infer<typeof ZUploadVersionChunkBase> & {
    data: string;
};

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

    const parsed = ZUploadVersionChunk.safeParse(await request.json());
    if (parsed.success === false) {
        return json(
            {
                error: parsed.error.format(),
            },
            StatusCodes.BAD_REQUEST,
        );
    }

    const updateService = await getUpdateService!(parsed.data.mode);
    if (updateService == null) {
        throw new Response(null, {
            status: StatusCodes.SERVICE_UNAVAILABLE,
            statusText: 'Service Unavailable',
        });
    }

    const [error, response] = await uploadVersionChunk(
        parsed.data.uploadId,
        parsed.data.concurrentId,
        parsed.data.offset,
        parsed.data.data,
        await getUpdateService!(parsed.data.mode),
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return json(response);
}
