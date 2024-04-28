import { IUserInfo } from '~/providers/auth/types';
import { getRedisClient } from './client.server';

const getSessionKey = (projectId: string, accessToken: string) =>
    `${projectId}|${accessToken}`;

export const getSessionFromRedis = async (
    projectId: string,
    accessToken: string,
) => {
    try {
        const client = await getRedisClient();
        const data = await client!.get(getSessionKey(projectId, accessToken));
        if (!data) return null;
        return JSON.parse(data) as IUserInfo;
    } catch (error) {
        console.log(`[ERROR] getSessionFromRedis failed : ${error}`);
        return null;
    }
};

export const sessionExistsInRedis = async (
    projectId: string,
    accessToken: string,
) => {
    try {
        const client = await getRedisClient();
        return (
            (await client!.exists(getSessionKey(projectId, accessToken))) > 0
        );
    } catch (error) {
        console.log(`[ERROR] sessionExistsInRedis failed : ${error}`);
        return false;
    }
};

export const saveSessionInRedis = async (
    projectId: string,
    accessToken: string,
    userInfo: IUserInfo,
    secondsToExpire: number = 60,
) => {
    try {
        const client = await getRedisClient();
        await client!.setex(
            getSessionKey(projectId, accessToken),
            secondsToExpire,
            JSON.stringify(userInfo),
        );
        return true;
    } catch (error) {
        console.log(`[ERROR] saveSessionInRedis failed : ${error}`);
        return false;
    }
};
