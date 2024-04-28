import { AppLoadContext } from '@remix-run/server-runtime';
import redis, { RedisOptions } from 'ioredis';

let client: redis | null = null;
export const getRedisClient = async (
    context: AppLoadContext,
): Promise<redis> => {
    if (client != null) return client;
    const RedisConnection: RedisOptions = {
        host: context.cloudflare.env.REDIS_HOST,
        port:
            context.cloudflare.env.REDIS_PORT != null
                ? +context.cloudflare.env.REDIS_PORT
                : undefined,
        username: context.cloudflare.env.REDIS_USER || undefined,
        password: context.cloudflare.env.REDIS_PASS || undefined,
        tls:
            context.cloudflare.env.REDIS_SSL != null &&
            +context.cloudflare.env.REDIS_SSL >= 1
                ? {
                      servername: context.cloudflare.env.REDIS_HOST,
                  }
                : undefined,
    };
    client = new redis(RedisConnection);
    return client;
};
