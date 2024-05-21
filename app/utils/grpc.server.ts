import * as grpc from '@grpc/grpc-js';
import { json } from '@remix-run/node';
import { StatusCodes } from 'http-status-codes';

const parseGrpcErrorIntoResponseState = (error: grpc.ServiceError) => {
    switch (error.code) {
        case grpc.status.INVALID_ARGUMENT:
            return {
                status: StatusCodes.BAD_REQUEST,
                statusText: 'invalid input provided',
            };
        case grpc.status.UNAUTHENTICATED:
            return {
                status: StatusCodes.UNAUTHORIZED,
                statusText: 'requires authentication',
            };
        case grpc.status.PERMISSION_DENIED:
            return {
                status: StatusCodes.UNAUTHORIZED,
                statusText: "you don't have enough permissions",
            };
        default:
        case grpc.status.UNAVAILABLE:
            return {
                status: StatusCodes.SERVICE_UNAVAILABLE,
                statusText: 'service is unavailable, try again later',
            };
    }
};

export const parseGrpcErrorIntoJsonResponse = (error: grpc.ServiceError) => {
    return json({}, parseGrpcErrorIntoResponseState(error));
};

export const parseGrpcErrorIntoResponse = (error: grpc.ServiceError) => {
    return new Response(null, parseGrpcErrorIntoResponseState(error));
};

export type TRpcError = [grpc.ServiceError, undefined];
export type TRpcResponse<TResponse> = TRpcError | [null, TResponse];
type TRpcFunction<TRequest, TResponse> = (
    request: TRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<TResponse>,
) => grpc.ClientUnaryCall;
export const promisifyRpc = async <TRequest, TResponse>(
    func: TRpcFunction<TRequest, TResponse>,
    request: TRequest,
    metadata: grpc.Metadata,
): Promise<TRpcResponse<TResponse>> => {
    return await new Promise<TRpcResponse<TResponse>>((resolve) => {
        func(request, metadata, (error, response) =>
            error != null
                ? resolve([error, undefined])
                : resolve([null, response as TResponse]),
        );
    });
};
