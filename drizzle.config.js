import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
config();

export default defineConfig({
  schema: './server/db/schema.js',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/journal.db',
  },
  verbose: true,
  strict: true,
});
