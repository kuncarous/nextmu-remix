import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { redirectToSwitch } from '~/services/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    return (await redirectToSwitch(context)) ?? redirect('/');
}
