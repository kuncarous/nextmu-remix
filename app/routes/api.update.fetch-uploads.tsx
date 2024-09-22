import { LoaderFunctionArgs, json } from '@remix-run/node';
import { StatusCodes } from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { serverOnly$ } from 'vite-env-only/macros';
import { z } from 'zod';
import { ZValidUpdateServiceMode, getUpdateService } from '~/consts/update';
import {
    getAccessToken,
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { fetchUploads } from '~/services/grpc/update.server';
import { parseGrpcErrorIntoJsonResponse } from '~/utils/grpc.server';
import { fromEntriesWithArraySupport } from '~/utils/url';

const requiredRole = serverOnly$('update:edit');

export const ZFetchUploads = z.object({
    mode: ZValidUpdateServiceMode,
    versionIds: z.array(z.string().refine((value) => ObjectId.isValid(value))),
});
export type IFetchUploads = z.infer<typeof ZFetchUploads>;

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

    const url = new URL(request.url);
    const parsed = ZFetchUploads.safeParse(
        fromEntriesWithArraySupport(url.searchParams.entries()),
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

    const [error, response] = await fetchUploads(
        parsed.data.versionIds,
        updateService,
        accessToken,
    );
    if (error) {
        return parseGrpcErrorIntoJsonResponse(error);
    }

    return response;
}
