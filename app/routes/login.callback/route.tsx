import { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { processAuthResponse } from '~/services/auth.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    return processAuthResponse(request, context);
}
