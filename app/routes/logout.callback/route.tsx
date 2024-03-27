import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { processLogoutResponse } from "~/services/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
    return processLogoutResponse(request, context);
}