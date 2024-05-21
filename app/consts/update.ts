import { serverOnly$ } from 'vite-env-only';
import {
    getGameUpdateService,
    getLauncherUpdateService,
} from '~/services/grpc/update.server';
import { constructZodLiteralUnionType } from '~/utils/array';

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
export const ZValidUpdateServiceMode = constructZodLiteralUnionType(
    UpdateServices.map((v) => v.value),
);

export const getUpdateService = serverOnly$(async (mode: string) => {
    if (mode === 'launcher') return await getLauncherUpdateService();
    else return await getGameUpdateService();
});

export const MinimumFileSize = 1 * 1024; // 1KB
export const MaximumFileSize = 5 * 1024 * 1024 * 1024; // 5GB
export const ChunkSize = 512 * 1024; // 512KB
export const MaxParallelChunks = 5;
