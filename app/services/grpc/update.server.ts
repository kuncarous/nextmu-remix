import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { AppLoadContext } from '@remix-run/cloudflare';
import { ObjectId } from 'mongodb';
import type { FetchVersionRequest } from '~/proto/nextmu/v1/FetchVersionRequest';
import type { FetchVersionResponse__Output as FetchVersionResponse } from '~/proto/nextmu/v1/FetchVersionResponse';
import type { ListVersionsRequest } from '~/proto/nextmu/v1/ListVersionsRequest';
import type { ListVersionsResponse__Output as ListVersionsResponse } from '~/proto/nextmu/v1/ListVersionsResponse';
import type { UpdateServiceClient } from '~/proto/nextmu/v1/UpdateService';
import type { ProtoGrpcType } from '~/proto/update';
import { promisifyRpc } from '~/utils/grpc.server';
import { defaultProtoLoaderConfig } from './config.server';

const updateDefinition = protoLoader.loadSync(
    'proto/models/update.proto',
    defaultProtoLoaderConfig,
);
const updateProto = grpc.loadPackageDefinition(
    updateDefinition,
) as unknown as ProtoGrpcType;

let gameUpdateService: UpdateServiceClient | null = null;
export const getGameUpdateService = async (context: AppLoadContext) => {
    if (gameUpdateService != null) return gameUpdateService;
    gameUpdateService = new updateProto.nextmu.v1.UpdateService(
        context.cloudflare.env.UPDATESERVICE_GAME_ADDRESS!,
        grpc.credentials.createInsecure(),
    );
    return gameUpdateService;
};

let launcherUpdateService: UpdateServiceClient | null = null;
export const getLauncherUpdateService = async (context: AppLoadContext) => {
    if (launcherUpdateService != null) return launcherUpdateService;
    gameUpdateService = new updateProto.nextmu.v1.UpdateService(
        context.cloudflare.env.UPDATESERVICE_LAUNCHER_ADDRESS!,
        grpc.credentials.createInsecure(),
    );
    return launcherUpdateService;
};

export const getVersionsList = async (
    page: number,
    size: number,
    client: UpdateServiceClient,
    accessToken: string,
) => {
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
    client: UpdateServiceClient,
    accessToken: string,
) => {
    const request: FetchVersionRequest = {
        id: new ObjectId(id).id,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<
        FetchVersionRequest,
        FetchVersionResponse
    >(client.fetchVersion.bind(client), request, metadata);

    return response;
};
