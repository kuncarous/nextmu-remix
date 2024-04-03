import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const ZSetTheme = z.object({
    theme: z.union([z.literal('light'), z.literal('dark')]),
});
export const ZSetThemeForm = zfd.formData(ZSetTheme);
