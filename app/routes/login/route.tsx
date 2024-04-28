import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { isAuthenticated, redirectToLogin } from '~/services/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    const authenticated = await isAuthenticated(request, context);
    if (authenticated != null && typeof authenticated !== 'boolean') return authenticated;
    if (authenticated === true) return redirect('/');
    return (await redirectToLogin(context)) ?? redirect('/');
}
