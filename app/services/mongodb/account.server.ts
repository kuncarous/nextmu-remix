import { ObjectId } from 'mongodb';
import type { IntrospectionResponse } from 'oauth4webapi';
import { getMongoClient } from './client.server';

interface IAccount {
    sub: string;
    aud: string;
    createdAt: Date;
}

export const createOrFindAccount = async (
    session: IntrospectionResponse,
) => {
    try {
        const mongoClient = await getMongoClient();
        const collection = mongoClient
            .db('portal')
            .collection<IAccount>('accounts');

        const aud =
            session.aud == null
                ? process.env.OPENID_PROJECT_ID!
                : Array.isArray(session.aud)
                  ? session.aud.includes(process.env.OPENID_PROJECT_ID!)
                      ? process.env.OPENID_PROJECT_ID!
                      : session.aud[session.aud.length - 1]
                  : session.aud;
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
                },
            },
            {
                upsert: true,
            },
        );
        if (updateResult.upsertedCount > 0) return updateResult.upsertedId;

        const findResult = await collection.findOne({
            sub: session.sub!,
            aud,
        });

        return findResult?._id;
    } catch (err) {
        return null;
    }
};

export const findAccount = async (
    accountId: ObjectId,
) => {
    try {
        const mongoClient = await getMongoClient();
        const collection = mongoClient
            .db('portal')
            .collection<IAccount>('accounts');
        const document = await collection.findOne({
            _id: accountId,
        });
        if (document == null) {
            throw new Error('account not found');
        }

        return document;
    } catch (err) {
        return null;
    }
};

export const checkAccountExists = async (
    accountId: ObjectId,
) => {
    try {
        const mongoClient = await getMongoClient();
        const collection = mongoClient
            .db('portal')
            .collection<IAccount>('accounts');
        return (
            (await collection.countDocuments(
                {
                    _id: accountId,
                },
                {
                    limit: 1,
                },
            )) > 0
        );
    } catch (err) {
        return null;
    }
};
