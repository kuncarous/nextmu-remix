import { z } from 'zod';

export const ZUserInfo = z.object({
    version: z.coerce.number(),
    aud: z.union([z.string(), z.array(z.string())]),
    sub: z.string(),
    email: z.string().email().optional(),
    email_verified: z.coerce.boolean().optional(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    expire_at: z.coerce.number().optional(),
    roles: z.array(z.string()).default([]),
});
export const ZPublicUserInfo = ZUserInfo.omit({ aud: true, sub: true });

export type IUserInfo = z.infer<typeof ZUserInfo>;
export type IPublicUserInfo = z.infer<typeof ZPublicUserInfo>;

export const UserInfoVersion = 1;
