import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { isAuthenticated, redirectToLogout } from '~/services/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    const authenticated = await isAuthenticated(request, context);
    if (authenticated != null && typeof authenticated !== 'boolean') return authenticated;
    if (!authenticated) return redirect('/');
    return (await redirectToLogout(request, context)) ?? redirect('/');
}
