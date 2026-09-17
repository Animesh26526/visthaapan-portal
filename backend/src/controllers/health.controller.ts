import type { Request, Response } from 'express';
import { config } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';

export function getHealthCheck(req: Request, res: Response): void {
  // Simple structured health verification confirming Express, Node, and routing are operational.
  // Database status is intentionally omitted / unconfigured as PostgreSQL belongs to Phase 3.
  res.status(200).json({
    success: true,
    service: 'VISTHAAPAN API',
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime() * 100) / 100,
    environment: config.env,
  });
}

export function getApiInfo(req: Request, res: Response): void {
  sendSuccess(res, {
    service: 'VISTHAAPAN API',
    version: 'v1',
    environment: config.env,
    description: 'Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network',
    docs: 'Authoritative specification in docs/',
    pipelineStage: 'Phase 2: Node.js + Express Backend Foundation',
    modules: {
      health: 'operational',
      database: 'unconfigured (Phase 3 pending)',
      ai_risk_engine: 'unconfigured (Phase 5 pending)',
      gis_spatial_engine: 'unconfigured (Phase 6 pending)',
      carrying_capacity: 'unconfigured (Phase 7 pending)',
      or_tools_solver: 'unconfigured (Phase 8 pending)',
    },
  });
}
