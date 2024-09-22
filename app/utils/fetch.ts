import { clientOnly$ } from 'vite-env-only/macros';
import wretch from 'wretch';
import AbortAddon from 'wretch/addons/abort';
import QueryStringAddon from 'wretch/addons/queryString';

export const apiClient = clientOnly$(
    wretch(`${window.location.protocol}//${window.location.host}`)
        .addon(QueryStringAddon)
        .addon(AbortAddon()),
);
