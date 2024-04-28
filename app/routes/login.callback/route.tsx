import { LoaderFunctionArgs } from '@remix-run/node';
import { processAuthResponse } from '~/services/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
    return processAuthResponse(request);
}
