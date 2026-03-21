import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Running database migrations...');

try {
  migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
  console.log('✅ Migrations complete');
} catch (err) {
  console.error('❌ Migration failed:', err);
  process.exit(1);
} finally {
  sqlite.close();
}
