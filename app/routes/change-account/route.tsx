import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { redirectToSwitch } from '~/services/auth.server';

export async function loader(_props: LoaderFunctionArgs) {
    return (await redirectToSwitch()) ?? redirect('/');
}
