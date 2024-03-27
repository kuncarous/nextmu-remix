import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import MUUID from "uuid-mongodb";
import { getMongoClient } from "./client.server";
import type { OpenIDTokenEndpointResponse } from "oauth4webapi";
import { Binary, ObjectId, WithId } from "mongodb";
import { AppLoadContext } from "@remix-run/cloudflare";
import { fromUnixTime, isBefore } from "date-fns";
import * as jwt from "jsonwebtoken";

interface IAuthSession {
    content: Binary;
    createdAt: Date;
    expireAt: Date;
}

const CipherAlgorithm = 'aes-256-cbc';
const generateAuthCipherKey = () => randomBytes(32);
const generateAuthCipherIV = () => Buffer.from(MUUID.v4().toString('N'), 'hex');

export const encryptBuffer = (key: Buffer, iv: Buffer, data: Buffer) => {
    try {
        const cipher = createCipheriv(CipherAlgorithm, key, iv);

        const blocks = [
            cipher.update(data),
            cipher.final(),
        ];

        return Buffer.concat([iv, ...blocks]);
    } catch(error) {
        return null;
    }
}

export const decryptBuffer = (key: Buffer, data: Buffer, encoding: BufferEncoding = 'utf-8') => {
    try {
        const iv = data.subarray(0, 16);
        const content = data.subarray(16);
        const decipher = createDecipheriv(CipherAlgorithm, key, iv);

        const blocks = [
            decipher.update(content),
            decipher.final(),
        ];

        return Buffer.concat(blocks).toString(encoding);
    } catch(error) {
        return null;
    }
}

export const registerAuthSession = async (session: OpenIDTokenEndpointResponse, context: AppLoadContext) => {
    try {
        const payload = jwt.decode(session.id_token, { json: true });
        if (payload == null) {
            throw new Error('failed to decode id_token');
        }

        const key = generateAuthCipherKey();
        const iv = generateAuthCipherIV();
        const sessionContent = encryptBuffer(key, iv, Buffer.from(JSON.stringify(session), 'utf-8'));
        if (sessionContent == null) {
            throw new Error('failed to encrypt session');
        }

        const mongoClient = await getMongoClient(context);
        const collection = mongoClient.db('keycloak_portal').collection<IAuthSession>('sessions');
        
        const sessionId = new ObjectId();
        await collection.insertOne(
            {
                _id: sessionId,
                content: new Binary(sessionContent),
                createdAt: new Date(),
                expireAt: fromUnixTime(payload.exp!),
            }
        );

        return {
            sessionId: sessionId.toHexString(),
            key: key.toString('base64'),
        };
    } catch (err) {
        return null;
    }
}

export const updateAuthSession = async (sessionId: ObjectId, session: OpenIDTokenEndpointResponse, context: AppLoadContext) => {
    try {
        const payload = jwt.decode(session.id_token, { json: true });
        if (payload == null) {
            throw new Error('failed to decode id_token');
        }

        const key = generateAuthCipherKey();
        const iv = generateAuthCipherIV();
        const sessionContent = encryptBuffer(key, iv, Buffer.from(JSON.stringify(session), 'utf-8'));
        if (sessionContent == null) {
            throw new Error('failed to encrypt session');
        }

        const mongoClient = await getMongoClient(context);
        const collection = mongoClient.db('keycloak_portal').collection<IAuthSession>('sessions');
        
        await collection.updateOne(
            {
                _id: sessionId,
            },
            {
                $set: {
                    content: new Binary(sessionContent),
                    expireAt: fromUnixTime(payload.exp!),
                }
            }
        );

        return {
            sessionId: sessionId.toHexString(),
            key: key.toString('base64'),
        };
    } catch (err) {
        return null;
    }
}

export const getAuthSession = async (sessionId: ObjectId, key: Buffer, context: AppLoadContext) => {
    try {
        const mongoClient = await getMongoClient(context);
        const collection = mongoClient.db('keycloak_portal').collection<IAuthSession>('sessions');
        const document = await collection.findOne(
            {
                _id: sessionId,
            }
        );
        if (document == null) {
            throw new Error('session not found');
        }

        const decrypted = decryptBuffer(key, Buffer.from(document.content.buffer));
        if (decrypted == null) {
            throw new Error('failed to decrypt session');
        }

        return JSON.parse(decrypted) as OpenIDTokenEndpointResponse;
    } catch (err) {
        return null;
    }
}