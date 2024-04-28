import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { FetchVersionRequest } from '~/proto/nextmu/v1/FetchVersionRequest';
import type { FetchVersionResponse__Output as FetchVersionResponse } from '~/proto/nextmu/v1/FetchVersionResponse';
import type { ListVersionsRequest } from '~/proto/nextmu/v1/ListVersionsRequest';
import type { ListVersionsResponse__Output as ListVersionsResponse } from '~/proto/nextmu/v1/ListVersionsResponse';
import type { UpdateServiceClient } from '~/proto/nextmu/v1/UpdateService';
import type { ProtoGrpcType } from '~/proto/update';
import { promisifyRpc } from '~/utils/grpc.server';
import { defaultProtoLoaderConfig } from './config.server';

const deadline = 5000;
const updateDefinition = protoLoader.loadSync(
    'proto/models/update.proto',
    defaultProtoLoaderConfig,
);
const updateProto = grpc.loadPackageDefinition(
    updateDefinition,
) as unknown as ProtoGrpcType;

let gameUpdateService: UpdateServiceClient | null = null;
export const getGameUpdateService = async () => {
    if (gameUpdateService != null) return gameUpdateService;
    const service = new updateProto.nextmu.v1.UpdateService(
        process.env.UPDATESERVICE_GAME_ADDRESS!,
        grpc.credentials.createInsecure(),
    );
    try {
        await new Promise<void>((resolve, error) =>
            service.waitForReady(Date.now() + deadline, (err) =>
                err ? error(err) : resolve(),
            ),
        );
        gameUpdateService = service;
        return gameUpdateService;
    } catch (e) {
        return null;
    }
};

let launcherUpdateService: UpdateServiceClient | null = null;
export const getLauncherUpdateService = async () => {
    if (launcherUpdateService != null) return launcherUpdateService;
    const service = new updateProto.nextmu.v1.UpdateService(
        process.env.UPDATESERVICE_LAUNCHER_ADDRESS!,
        grpc.credentials.createInsecure(),
    );
    try {
        await new Promise<void>((resolve, error) =>
            service.waitForReady(Date.now() + deadline, (err) =>
                err ? error(err) : resolve(),
            ),
        );
        launcherUpdateService = service;
        return launcherUpdateService;
    } catch (e) {
        return null;
    }
};

export const getVersionsList = async (
    page: number,
    size: number,
    client: UpdateServiceClient | null,
    accessToken: string,
): Promise<[grpc.ServiceError | null, ListVersionsResponse | undefined]> => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ];
    }

    const request: ListVersionsRequest = {
        page,
        size,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<
        ListVersionsRequest,
        ListVersionsResponse
    >(client.listVersions.bind(client), request, metadata);

    return response;
};

export const fetchVersion = async (
    id: string,
    client: UpdateServiceClient | null,
    accessToken: string,
): Promise<[grpc.ServiceError | null, FetchVersionResponse | undefined]> => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ];
    }

    const request: FetchVersionRequest = {
        id,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<
        FetchVersionRequest,
        FetchVersionResponse
    >(client.fetchVersion.bind(client), request, metadata);

    return response;
};
