import { AppLoadContext } from "@remix-run/cloudflare";
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;
export const getMongoClient = async (context: AppLoadContext) => {
    if (client != null) return client;
    client = await MongoClient.connect(context.cloudflare.env.MONGODB_URL);
    return client;
}