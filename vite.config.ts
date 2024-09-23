import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import path from 'path';
import { defineConfig } from 'vite';
import { envOnlyMacros } from 'vite-env-only';
import topLevelAwait from 'vite-plugin-top-level-await';
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
        topLevelAwait({
            // The export name of top-level await promise for each chunk module
            promiseExportName: '__tla',
            // The function to generate import names of top-level await promise in each chunk module
            promiseImportName: (i) => `__tla_${i}`,
        }),
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
