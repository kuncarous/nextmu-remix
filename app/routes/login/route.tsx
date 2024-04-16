import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { isAuthenticated, redirectToLogin } from '~/services/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    if (await isAuthenticated(request, context)) return redirect('/');
    return (await redirectToLogin(context)) ?? redirect('/');
}
