import { z } from "zod";

export const ZSetTheme = z.object({
    theme: z.union([z.literal('light'), z.literal('dark')]),
});