/// <reference types="vite/client" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />
import type { AppLoadContext } from "@remix-run/cloudflare";

declare module "__STATIC_CONTENT_MANIFEST" {
    const manifest: string;
    export default manifest;
}