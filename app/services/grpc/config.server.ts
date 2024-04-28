import * as protoLoader from '@grpc/proto-loader';

export const defaultProtoLoaderConfig: protoLoader.Options = {
    longs: String,
    defaults: true,
    oneofs: true,
};
