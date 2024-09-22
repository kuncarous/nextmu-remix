import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import path from 'path';
import { defineConfig } from 'vite';
import { envOnlyMacros } from 'vite-env-only';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

export default defineConfig({
    plugins: [
        remix({
            future: {
                unstable_optimizeDeps: true,
            },
        }),
        tsconfigPaths(),
        envOnlyMacros(),
    ],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
        preprocessorOptions: {
            scss: {
                api: 'modern',
                additionalData: `@import '@/styles/_mantine.scss';`,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'), // Define the ~ alias
        },
    },
});
