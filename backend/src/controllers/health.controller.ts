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
    pipelineStage: 'Phase 5 - Phase 8: AI Intelligence, GIS Spatial, Capacity Assessment & OR Allocation Engine',
    modules: {
      health: 'operational',
      database: 'operational (PostgreSQL 16 + PostGIS 3.4)',
      ai_risk_engine: 'operational (XGBoost + Platt Calibration + TreeSHAP)',
      gis_spatial_engine: 'operational (PostGIS 3.4 + Multi-Hazard Layers + Red Zones + Site Suitability)',
      carrying_capacity: 'operational (Phase 7 Resource Bottlenecks & Hard Hazard Exclusion)',
      or_tools_solver: 'operational (Phase 8 Google OR-Tools SCIP Allocation Solver)',
    },
  });
}
