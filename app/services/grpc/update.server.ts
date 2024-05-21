import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Empty__Output } from '~/proto/google/protobuf/Empty';
import type { CreateVersionRequest } from '~/proto/nextmu/v1/CreateVersionRequest';
import type { CreateVersionResponse__Output as CreateVersionResponse } from '~/proto/nextmu/v1/CreateVersionResponse';
import type { EditVersionRequest } from '~/proto/nextmu/v1/EditVersionRequest';
import type { FetchVersionRequest } from '~/proto/nextmu/v1/FetchVersionRequest';
import type { FetchVersionResponse__Output as FetchVersionResponse } from '~/proto/nextmu/v1/FetchVersionResponse';
import type { ListVersionsRequest } from '~/proto/nextmu/v1/ListVersionsRequest';
import type { ListVersionsResponse__Output as ListVersionsResponse } from '~/proto/nextmu/v1/ListVersionsResponse';
import { StartUploadVersionRequest } from '~/proto/nextmu/v1/StartUploadVersionRequest';
import { StartUploadVersionResponse__Output as StartUploadVersionResponse } from '~/proto/nextmu/v1/StartUploadVersionResponse';
import type { UpdateServiceClient } from '~/proto/nextmu/v1/UpdateService';
import { UploadVersionChunkRequest } from '~/proto/nextmu/v1/UploadVersionChunkRequest';
import { UploadVersionChunkResponse__Output as UploadVersionChunkResponse } from '~/proto/nextmu/v1/UploadVersionChunkResponse';
import { VersionType } from '~/proto/nextmu/v1/VersionType';
import type { ProtoGrpcType } from '~/proto/update';
import { TRpcError, promisifyRpc } from '~/utils/grpc.server';
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
) => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ] as TRpcError;
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
) => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ] as TRpcError;
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

export const createVersion = async (
    type: VersionType,
    description: string,
    client: UpdateServiceClient | null,
    accessToken: string,
) => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ] as TRpcError;
    }

    const request: CreateVersionRequest = {
        type,
        description,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<
        CreateVersionRequest,
        CreateVersionResponse
    >(client.createVersion.bind(client), request, metadata);

    return response;
};

export const editVersion = async (
    versionId: string,
    description: string,
    client: UpdateServiceClient | null,
    accessToken: string,
) => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ] as TRpcError;
    }

    const request: EditVersionRequest = {
        id: versionId,
        description,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<EditVersionRequest, Empty__Output>(
        client.editVersion.bind(client),
        request,
        metadata,
    );

    return response;
};

export const startUploadVersion = async (
    versionId: string,
    hash: string,
    type: string,
    chunkSize: number,
    fileSize: number,
    client: UpdateServiceClient | null,
    accessToken: string,
) => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ] as TRpcError;
    }

    const request: StartUploadVersionRequest = {
        versionId,
        hash,
        type,
        chunkSize,
        fileSize,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<
        StartUploadVersionRequest,
        StartUploadVersionResponse
    >(client.startUploadVersion.bind(client), request, metadata);

    return response;
};

export const uploadVersionChunk = async (
    uploadId: string,
    concurrentId: string,
    offset: number,
    data: Buffer,
    client: UpdateServiceClient | null,
    accessToken: string,
) => {
    if (client == null) {
        return [
            {
                code: grpc.status.UNAVAILABLE,
                details: 'service is unavailable, try again later',
            } as grpc.ServiceError,
            undefined,
        ] as TRpcError;
    }

    const request: UploadVersionChunkRequest = {
        uploadId,
        concurrentId,
        offset,
        data,
    };

    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${accessToken}`);

    const response = await promisifyRpc<
        UploadVersionChunkRequest,
        UploadVersionChunkResponse
    >(client.uploadVersionChunk.bind(client), request, metadata);

    return response;
};
