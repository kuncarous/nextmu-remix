import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import envOnly from 'vite-env-only';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig({
    plugins: [remix(), tsconfigPaths(), envOnly()],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
        preprocessorOptions: {
            scss: {
                additionalData: `@import './styles/_mantine.scss';`,
            },
        },
    },
});
