import { serverOnly$ } from 'vite-env-only';
import {
    getGameUpdateService,
    getLauncherUpdateService,
} from '~/services/grpc/update.server';

export interface IUpdateService {
    value: string;
    label: string;
}

export const DefaultMode: string = 'game';
export const UpdateServices: IUpdateService[] = [
    {
        value: 'game',
        label: 'dashboard.updates.select-service.game',
    },
    {
        value: 'launcher',
        label: 'dashboard.updates.select-service.launcher',
    },
];

export const getUpdateService = serverOnly$(async (mode: string) => {
    if (mode === 'launcher') return await getLauncherUpdateService();
    else return await getGameUpdateService();
});
