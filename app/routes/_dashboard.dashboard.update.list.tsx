import { LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { StatusCodes } from 'http-status-codes';
import {
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { hasDashboardRoles } from '~/utils/dashboard';

export async function loader({ request, context }: LoaderFunctionArgs) {
    const user = await getPublicUserInfoFromSession(request, context);
    if (user == null) {
        return redirectToLogin(context, request);
    }
    if (hasDashboardRoles(user) == false) {
        throw new Response(null, {
            status: StatusCodes.UNAUTHORIZED,
            statusText: 'Unauthorized',
        });
    }

    return json({});
}

export default function Page() {
    return <></>;
}
