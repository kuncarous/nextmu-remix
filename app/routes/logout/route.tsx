import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { isAuthenticated, redirectToLogout } from '~/services/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const authenticated = await isAuthenticated(request);
    if (authenticated != null && typeof authenticated !== 'boolean') return authenticated;
    if (!authenticated) return redirect('/');
    return (await redirectToLogout(request)) ?? redirect('/');
}
