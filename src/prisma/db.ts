import 'dotenv/config';
import { MongoClient } from 'mongodb';
import mongo from '@prisma/orm-mongo/runtime';
import { contractFromJson } from '@prisma/orm-mongo/static';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const contract = contractFromJson<Contract>(contractJson);

function createClients() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is not set. Add it to .env');
  // One driver client serves both the Prisma ORM and GridFS (media file storage).
  const mongoClient = new MongoClient(url);
  const dbName = mongoClient.db().databaseName;
  const db = mongo({ contract, mongoClient, dbName });
  return { db, mongoClient, dbName };
}

type Clients = ReturnType<typeof createClients>;

// Reuse the clients across hot reloads in development.
const globalForDb = globalThis as unknown as { __shearDb?: Clients };

function clients(): Clients {
  if (!globalForDb.__shearDb) globalForDb.__shearDb = createClients();
  return globalForDb.__shearDb;
}

export const db = new Proxy({} as Clients['db'], {
  get(_target, prop) {
    return Reflect.get(clients().db, prop);
  },
});

export function mongoDriver() {
  const { mongoClient, dbName } = clients();
  return mongoClient.db(dbName);
}

export async function closeDb() {
  if (!globalForDb.__shearDb) return;
  await globalForDb.__shearDb.mongoClient.close();
  globalForDb.__shearDb = undefined;
}
