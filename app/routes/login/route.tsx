import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { isAuthenticated, redirectToAuth } from "~/services/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
    if (await isAuthenticated(request, context)) return redirect('/');
    return (await redirectToAuth(context)) ?? redirect('/');
}