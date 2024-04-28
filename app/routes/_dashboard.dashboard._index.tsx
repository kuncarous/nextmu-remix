import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { StatusCodes } from 'http-status-codes';
import {
    getPublicUserInfoFromSession,
    redirectToLogin,
} from '~/services/auth.server';
import { hasDashboardRoles } from '~/utils/dashboard';

export async function loader({ request }: LoaderFunctionArgs) {
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

    return redirect('/dashboard/update/list');
}

/* assign a default function to enable ErrorBoundary */
export default function Page() {
    return null;
}
