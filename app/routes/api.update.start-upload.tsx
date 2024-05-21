import { ActionFunctionArgs, json } from '@remix-run/node';
import { StatusCodes } from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { serverOnly$ } from 'vite-env-only';
import { z } from 'zod';
import {
    MaximumFileSize,
    MinimumFileSize,
    ZValidUpdateServiceMode,
    getUpdateService,
} from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { startUploadVersion } from '~/services/grpc/update.server';
import { parseGrpcErrorIntoJsonResponse } from '~/utils/grpc.server';

const requiredRole = serverOnly$('update:edit');

export const ZStartUploadVersion = z.object({
    mode: ZValidUpdateServiceMode,
    versionId: z.string().refine((value) => ObjectId.isValid(value)),
    hash: z.string().length(64),
    type: z.literal('application/zip'),
    chunkSize: z.coerce
        .number()
        .multipleOf(2)
        .min(16 * 1024)
        .max(512 * 1024),
    fileSize: z.coerce.number().min(MinimumFileSize).max(MaximumFileSize),
});
export type IStartUploadVersion = z.infer<typeof ZStartUploadVersion>;

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

    const parsed = ZStartUploadVersion.safeParse(await request.json());
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

    const [error, response] = await startUploadVersion(
        parsed.data.versionId,
        parsed.data.hash,
        parsed.data.type,
        parsed.data.chunkSize,
        parsed.data.fileSize,
        await getUpdateService!(parsed.data.mode),
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return json(response);
}
