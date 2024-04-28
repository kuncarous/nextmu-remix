import { LoaderFunctionArgs } from '@remix-run/node';
import { processLogoutResponse } from '~/services/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
    return processLogoutResponse(request);
}
