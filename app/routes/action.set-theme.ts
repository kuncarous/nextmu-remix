import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/cloudflare";
import { userPrefs } from "~/cookies.server";
import { ZSetTheme } from "~/types/theme";

export const action: ActionFunction = async ({ request }) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};
    const parsed = ZSetTheme.safeParse(await request.json());

    if (!parsed.success) {
        return json({ error: parsed.error.format() });
    }

    return json(
        {},
        {
            headers: {
                "Set-Cookie": await userPrefs.serialize({
                    ...cookie,
                    theme: parsed.data.theme,
                })
            }
        }
    );
};

export const loader: LoaderFunction = () => redirect('/', { status: 404 });