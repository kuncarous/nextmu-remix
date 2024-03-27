export interface UserInfo {
    aud: string;
    sub: string;
    email: string;
    email_verified: boolean;
    given_name: string;
    family_name: string;
    expire_at?: number;
    expired: boolean;
}