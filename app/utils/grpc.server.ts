import * as grpc from '@grpc/grpc-js';
import { StatusCodes } from 'http-status-codes';

export const parseGrpcErrorIntoResponse = (error: grpc.ServiceError) => {
    switch (error.code) {
        case grpc.status.INVALID_ARGUMENT:
            return new Response(null, {
                status: StatusCodes.BAD_REQUEST,
                statusText: 'invalid input provided',
            });
        case grpc.status.UNAUTHENTICATED:
            return new Response(null, {
                status: StatusCodes.UNAUTHORIZED,
                statusText: 'requires authentication',
            });
        case grpc.status.PERMISSION_DENIED:
            return new Response(null, {
                status: StatusCodes.UNAUTHORIZED,
                statusText: "you don't have enough permissions",
            });
        default:
        case grpc.status.UNAVAILABLE:
            return new Response(null, {
                status: StatusCodes.SERVICE_UNAVAILABLE,
                statusText: 'service is unavailable, try again later',
            });
    }
};

type TRpcFunction<TRequest, TResponse> = (
    request: TRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<TResponse>,
) => grpc.ClientUnaryCall;
export const promisifyRpc = async <TRequest, TResponse>(
    func: TRpcFunction<TRequest, TResponse>,
    request: TRequest,
    metadata: grpc.Metadata,
): Promise<[grpc.ServiceError | null, TResponse | undefined]> => {
    return await new Promise<[grpc.ServiceError | null, TResponse | undefined]>(
        (resolve) => {
            func(request, metadata, (error, response) =>
                resolve([error, response]),
            );
        },
    );
};
