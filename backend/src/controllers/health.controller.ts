import type { Request, Response } from 'express';
import { config } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { testConnection } from '../db/pool.js';

export async function getHealthCheck(req: Request, res: Response): Promise<void> {
  // Test actual database connectivity and PostGIS status
  const dbStatus = await testConnection();

  const isHealthy = dbStatus.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    service: 'VISTHAAPAN API',
    status: isHealthy ? 'healthy' : 'degraded',
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime() * 100) / 100,
    environment: config.env,
    dependencies: {
      database: dbStatus,
    },
  });
}

export function getApiInfo(req: Request, res: Response): void {
  sendSuccess(res, {
    service: 'VISTHAAPAN API',
    version: 'v1',
    environment: config.env,
    description: 'Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network',
    docs: 'Authoritative specification in docs/',
    pipelineStage: 'Phase 5: AI Risk, Vulnerability & Relocation Priority Engine',
    modules: {
      health: 'operational',
      database: 'operational (PostgreSQL 16 + PostGIS 3.4)',
      ai_risk_engine: 'operational (XGBoost + Platt Calibration + TreeSHAP)',
      gis_spatial_engine: 'unconfigured (Phase 6 pending)',
      carrying_capacity: 'unconfigured (Phase 7 pending)',
      or_tools_solver: 'unconfigured (Phase 8 pending)',
    },
  });
}
