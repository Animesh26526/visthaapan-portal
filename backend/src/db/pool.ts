import pg from 'pg';
import type { DatabaseDependencyStatus } from '../types/index.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const isLocalDb = !config.databaseUrl || 
  config.databaseUrl.includes('localhost') || 
  config.databaseUrl.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

pool.on('error', (err: Error) => {
  logger.error({ err: err.message }, 'Unexpected idle client error in PostgreSQL connection pool');
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug({ text, duration, rows: res.rowCount }, 'Executed SQL query');
    return res;
  } catch (err: any) {
    const duration = Date.now() - start;
    logger.error({ text, duration, error: err.message }, 'SQL query execution failed');
    throw err;
  }
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function testConnection(): Promise<DatabaseDependencyStatus> {
  try {
    const client = await pool.connect();
    try {
      const versionRes = await client.query('SELECT version();');
      const postgisRes = await client.query('SELECT PostGIS_Version();');

      const pgVersion = (versionRes.rows[0]?.version as string)?.split(' on ')[0] || 'Unknown PostgreSQL';
      const postgisVersion = postgisRes.rows[0]?.postgis_version || 'Unknown PostGIS';

      return {
        status: 'connected',
        engine: 'PostgreSQL + PostGIS',
        version: pgVersion,
        postgisVersion,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    logger.warn({ error: err.message }, 'PostgreSQL database connectivity check failed');
    return {
      status: 'unavailable',
      engine: 'PostgreSQL + PostGIS',
      error: err.message,
    };
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL connection pool closed');
}
