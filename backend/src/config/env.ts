import dotenv from 'dotenv';
import type { AppConfig, Environment } from '../types/index.js';

// Load .env file if present in the current working directory or backend root
dotenv.config();

function parseEnvironment(val?: string): Environment {
  if (val === 'production' || val === 'test') {
    return val;
  }
  return 'development';
}

function parsePort(val?: string, defaultPort = 5000): number {
  if (!val) return defaultPort;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    console.warn(`[CONFIG WARNING] Invalid PORT "${val}" specified. Falling back to default port ${defaultPort}.`);
    return defaultPort;
  }
  return parsed;
}

function parseApiPrefix(val?: string): string {
  if (!val) return '/api/v1';
  let cleaned = val.trim();
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  if (cleaned.endsWith('/') && cleaned.length > 1) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

const env: Environment = parseEnvironment(process.env.NODE_ENV);
const port = parsePort(process.env.PORT, 5000);
const apiPrefix = parseApiPrefix(process.env.API_PREFIX);
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173';
const logLevel = process.env.LOG_LEVEL?.trim() || (env === 'development' ? 'debug' : 'info');

// Database configuration
const dbHost = process.env.DB_HOST?.trim() || 'localhost';
const dbPort = parsePort(process.env.DB_PORT, 5432);
const dbName = process.env.DB_NAME?.trim() || 'visthaapan';
const dbUser = process.env.DB_USER?.trim() || 'visthaapan';
const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'visthaapan_dev';
const databaseUrl = process.env.DATABASE_URL?.trim() || `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

export const config: AppConfig = {
  env,
  port,
  apiPrefix,
  frontendOrigin,
  logLevel,
  isDev: env === 'development',
  isProd: env === 'production',
  isTest: env === 'test',
  databaseUrl,
  dbHost,
  dbPort,
  dbName,
  dbUser,
  dbPassword,
};
