import React, { createContext, useContext, useMemo } from 'react';
import type { UserInfo } from './types';

export const UserInfoContext = createContext<UserInfo | null>(null);

export function useUserInfo() {
    return useContext(UserInfoContext);
}

export interface UserInfoProviderProps {
    userInfo: UserInfo | null;
    children: React.ReactNode;
}

export function UserInfoProvider({
    userInfo,
    children,
  }: UserInfoProviderProps) {
    const data = useMemo(
      () => userInfo,
      [userInfo]
    );
  
    return (
      <UserInfoContext.Provider value={data}>{children}</UserInfoContext.Provider>
    );
  }
  
  UserInfoProvider.displayName = 'NextMU/UserInfoProvider';