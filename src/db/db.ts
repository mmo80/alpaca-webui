import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

import * as schema from './schema';
import { env } from '@/env';

const sqlite = new Database(env.DATABASE_URL);

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, {
  schema,
});
