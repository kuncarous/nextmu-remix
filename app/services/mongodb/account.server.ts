import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import MUUID from "uuid-mongodb";
import { getMongoClient } from "./client.server";
import type { IntrospectionResponse } from "oauth4webapi";
import { ObjectId } from "mongodb";
import { AppLoadContext } from "@remix-run/cloudflare";

interface IAccount {
    sub: string;
    aud: string;
    createdAt: Date;
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

export const createOrFindAccount = async (session: IntrospectionResponse, context: AppLoadContext) => {
    try {
        const mongoClient = await getMongoClient(context);
        const collection = mongoClient.db('portal').collection<IAccount>('accounts');
        
        const aud = (
            session.aud == null
            ? context.cloudflare.env.OPENID_PROJECT_ID!
            : Array.isArray(session.aud)
            ? (
                session.aud.includes(context.cloudflare.env.OPENID_PROJECT_ID!)
                ? context.cloudflare.env.OPENID_PROJECT_ID!
                : session.aud[session.aud.length-1]
            )
            : session.aud
        );
        const updateResult = await collection.updateOne(
            {
                sub: session.sub!,
                aud,
            },
            {
                $setOnInsert: {
                    _id: new ObjectId(),
                    sub: session.sub!,
                    aud,
                }
            },
            {
                upsert: true
            }
        );
        if (updateResult.upsertedCount > 0) return updateResult.upsertedId;

        const findResult = await collection.findOne(
            {
                sub: session.sub!,
                aud,
            }
        );

        return findResult?._id;
    } catch (err) {
        return null;
    }
}

export const findAccount = async (accountId: ObjectId, context: AppLoadContext) => {
    try {
        const mongoClient = await getMongoClient(context);
        const collection = mongoClient.db('portal').collection<IAccount>('accounts');
        const document = await collection.findOne(
            {
                _id: accountId,
            }
        );
        if (document == null) {
            throw new Error('account not found');
        }

        return document;
    } catch (err) {
        return null;
    }
}

export const checkAccountExists = async (accountId: ObjectId, context: AppLoadContext) => {
    try {
        const mongoClient = await getMongoClient(context);
        const collection = mongoClient.db('portal').collection<IAccount>('accounts');
        return await collection.countDocuments(
            {
                _id: accountId,
            },
            {
                limit: 1,
            }
        ) > 0;
    } catch (err) {
        return null;
    }
}