import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from 'dotenv';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema.js';

config();

const dbPath = process.env.DATABASE_PATH || './data/journal.db';

// Ensure directory exists
try {
  mkdirSync(dirname(dbPath), { recursive: true });
} catch {}

const sqlite = new Database(dbPath);

// Performance pragmas
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('synchronous = NORMAL');

export const db = drizzle(sqlite, { schema });
export { sqlite };
