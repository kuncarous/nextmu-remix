import redis, { RedisOptions } from 'ioredis';

export const RedisConnection: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT != null ? +process.env.REDIS_PORT : undefined,
    username: process.env.REDIS_USER || undefined,
    password: process.env.REDIS_PASS || undefined,
    tls:
        process.env.REDIS_SSL != null && +process.env.REDIS_SSL >= 1
            ? {
                  servername: process.env.REDIS_HOST,
              }
            : undefined,
};
export const client: redis = new redis(RedisConnection);
