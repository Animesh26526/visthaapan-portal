import dotenv from 'dotenv';
import path from 'path';
import type { AppConfig, Environment } from '../types/index.js';

// Load .env file if present in the current working directory or backend root
dotenv.config();

function parseEnvironment(val?: string): Environment {
  if (val === 'production' || val === 'test') {
    return val;
  }
  return 'development';
}

function parsePort(val?: string): number {
  if (!val) return 5000;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    console.warn(`[CONFIG WARNING] Invalid PORT "${val}" specified. Falling back to default port 5000.`);
    return 5000;
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
const port = parsePort(process.env.PORT);
const apiPrefix = parseApiPrefix(process.env.API_PREFIX);
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173';
const logLevel = process.env.LOG_LEVEL?.trim() || (env === 'development' ? 'debug' : 'info');

export const config: AppConfig = {
  env,
  port,
  apiPrefix,
  frontendOrigin,
  logLevel,
  isDev: env === 'development',
  isProd: env === 'production',
  isTest: env === 'test',
};
