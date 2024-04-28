import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { isAuthenticated, redirectToLogin } from '~/services/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const authenticated = await isAuthenticated(request);
    if (authenticated != null && typeof authenticated !== 'boolean') return authenticated;
    if (authenticated === true) return redirect('/');
    return (await redirectToLogin()) ?? redirect('/');
}
