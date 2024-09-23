import { LoaderFunctionArgs, json } from '@remix-run/node';
import { ObjectId } from 'bson';
import { StatusCodes } from 'http-status-codes';
import { serverOnly$ } from 'vite-env-only/macros';
import { z } from 'zod';
import { ZValidUpdateServiceMode, getUpdateService } from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { fetchVersion } from '~/services/grpc/update.server';
import { parseGrpcErrorIntoJsonResponse } from '~/utils/grpc.server';

const requiredRole = serverOnly$('update:edit');

export const ZFetchVersion = z.object({
    mode: ZValidUpdateServiceMode,
    versionId: z.string().refine((value) => ObjectId.isValid(value)),
});
export type IFetchVersion = z.infer<typeof ZFetchVersion>;

export async function loader({ request, params }: LoaderFunctionArgs) {
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

    const url = new URL(request.url);
    const parsed = ZFetchVersion.safeParse(
        Object.fromEntries(url.searchParams.entries()),
    );
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

    const [error, response] = await fetchVersion(
        parsed.data.versionId,
        updateService,
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return response;
}
