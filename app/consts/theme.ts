import { z } from 'zod';

export const ThemeCookieName = 'mantine-theme';
export const ZThemeMode = z.object({
    mode: z.union([z.literal('light'), z.literal('dark')]),
});
export type IThemeMode = z.infer<typeof ZThemeMode>;
export const DefaultThemeMode: IThemeMode = {
    mode: 'light',
};
