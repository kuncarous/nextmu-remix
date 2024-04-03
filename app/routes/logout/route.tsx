import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { isAuthenticated, redirectToLogout } from '~/services/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    const isLoggedIn = await isAuthenticated(request, context);
    if (!isLoggedIn) return redirect('/');
    return (await redirectToLogout(request, context)) ?? redirect('/');
}
