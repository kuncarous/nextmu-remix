import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;
export const getMongoClient = async () => {
    if (client != null) return client;
    client = await MongoClient.connect(process.env.MONGODB_URI!);
    return client;
};
