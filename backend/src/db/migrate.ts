import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool, getClient } from './pool.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migrations are stored in backend/migrations
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export async function runMigrations(): Promise<{ applied: string[]; total: number }> {
  logger.info({ dir: MIGRATIONS_DIR }, 'Starting VISTHAAPAN database migration runner...');

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const client = await getClient();
  const appliedList: string[] = [];

  try {
    // 1. Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL
      );
    `);

    // 2. Query already applied migrations
    const { rows: existingRows } = await client.query<{ migration_name: string }>(
      'SELECT migration_name FROM schema_migrations ORDER BY id ASC;'
    );
    const appliedSet = new Set(existingRows.map((r) => r.migration_name));

    // 3. Read migration files sorted in alphanumeric order
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    logger.info(`Discovered ${migrationFiles.length} migration files in repository.`);

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        logger.debug({ file }, 'Migration already applied. Skipping.');
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');

      logger.info({ file }, `Applying migration ${file}...`);

      const start = Date.now();
      await client.query('BEGIN;');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (migration_name, checksum) VALUES ($1, $2);',
          [file, checksum]
        );
        await client.query('COMMIT;');
        const duration = Date.now() - start;
        logger.info({ file, duration }, `✓ Migration ${file} applied successfully.`);
        appliedList.push(file);
      } catch (err: any) {
        await client.query('ROLLBACK;');
        logger.error({ file, error: err.message }, `✗ Migration ${file} failed! Transaction rolled back.`);
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    logger.info(`Migration run complete. ${appliedList.length} new migrations applied.`);
    return {
      applied: appliedList,
      total: migrationFiles.length,
    };
  } finally {
    client.release();
  }
}

// CLI entrypoint execution
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Fatal migration error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
