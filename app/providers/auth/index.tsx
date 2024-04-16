import React, { createContext, useContext, useMemo } from 'react';
import type { IPublicUserInfo } from './types';

export const UserInfoContext = createContext<IPublicUserInfo | null>(null);

export function useUserInfo() {
    return useContext(UserInfoContext);
}

export interface UserInfoProviderProps {
    userInfo: IPublicUserInfo | null;
    children: React.ReactNode;
}

export function UserInfoProvider({
    userInfo,
    children,
}: UserInfoProviderProps) {
    const data = useMemo(() => userInfo, [userInfo]);

    return (
        <UserInfoContext.Provider value={data}>
            {children}
        </UserInfoContext.Provider>
    );
}

UserInfoProvider.displayName = 'NextMU/UserInfoProvider';
