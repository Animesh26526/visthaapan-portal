import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, getClient } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export async function getMigrationStatus(): Promise<void> {
  const client = await getClient();

  try {
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      );
    `);

    const hasMigrationsTable = tableCheck.rows[0]?.exists === true;
    const appliedMap = new Map<string, string>();

    if (hasMigrationsTable) {
      const { rows } = await client.query<{ migration_name: string; applied_at: string }>(
        'SELECT migration_name, applied_at FROM schema_migrations ORDER BY id ASC;'
      );
      for (const row of rows) {
        appliedMap.set(row.migration_name, new Date(row.applied_at).toISOString());
      }
    }

    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log('\n--- VISTHAAPAN Database Migration Status ---');
    console.log(`Directory: ${MIGRATIONS_DIR}\n`);

    for (const file of migrationFiles) {
      if (appliedMap.has(file)) {
        console.log(`  [APPLIED] ${file}  (at ${appliedMap.get(file)})`);
      } else {
        console.log(`  [PENDING] ${file}`);
      }
    }
    console.log(`\nTotal: ${migrationFiles.length} migrations (${appliedMap.size} applied, ${migrationFiles.length - appliedMap.size} pending)\n`);
  } finally {
    client.release();
  }
}

const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  getMigrationStatus()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration status error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
