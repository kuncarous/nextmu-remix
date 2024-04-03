/**
 * This is intended to be a basic starting point for linting in your app.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

import js from '@eslint/js';
import tsEslintConfig from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsxA11yConfig from 'eslint-plugin-jsx-a11y';
import reactConfig from 'eslint-plugin-react';
import reactHooksConfig from 'eslint-plugin-react-hooks';
import globals from 'globals';
//import importConfig from 'eslint-plugin-import'; // TO DO : update package when fixed for flat config
import stylistic from '@stylistic/eslint-plugin';
import {
    configs as ReactQueryConfigs,
    rules as ReactQueryRules,
} from '@tanstack/eslint-plugin-query';
import gitignore from 'eslint-config-flat-gitignore';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    gitignore(),
    js.configs.recommended,
    {
        plugins: {
            '@stylistic': stylistic,
            '@tanstack/eslint-plugin-query': {
                rules: ReactQueryRules,
                configs: ReactQueryConfigs,
            },
            //import: importConfig,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.commonjs,
            },
        },
        rules: {
            '@tanstack/eslint-plugin-query/exhaustive-deps': 'error',
            '@tanstack/eslint-plugin-query/no-rest-destructuring': 'warn',
            '@tanstack/eslint-plugin-query/stable-query-client': 'error',
        },
    },

    // React
    {
        files: ['app/**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react: reactConfig,
            'jsx-a11y': jsxA11yConfig,
            'react-hooks': reactHooksConfig,
        },
        settings: {
            react: {
                version: 'detect',
            },
            formComponents: ['Form'],
            linkComponents: [
                { name: 'Link', linkAttribute: 'to' },
                { name: 'NavLink', linkAttribute: 'to' },
            ],
        },
        rules: {
            '@stylistic/indent': ['error', 4],
            ...reactConfig.configs.recommended.rules,
            ...reactConfig.configs['jsx-runtime'].rules,
            ...reactHooksConfig.configs.recommended.rules,
            ...jsxA11yConfig.configs.recommended.rules,
        },
    },

    // Typescript
    {
        files: ['app/**/*.{ts,tsx}'],
        plugins: {
            '@typescript-eslint': tsEslintConfig,
        },
        languageOptions: {
            parser: tsParser,
        },
        /*settings: {
            ...importConfig.configs.typescript.settings,
            "import/internal-regex": "^~/",
            "import/resolver": {
                ...importConfig.configs.typescript.settings['import/resolver'],
                typescript: {
                    alwaysTryTypes: true,
                },
            },
        },*/
        rules: {
            ...tsEslintConfig.configs.base.rules,
            ...tsEslintConfig.configs['eslint-recommended'].rules,
            ...tsEslintConfig.configs.recommended.rules,
            //...importConfig.configs.typescript.rules,
        },
    },
    eslintConfigPrettier,
];
