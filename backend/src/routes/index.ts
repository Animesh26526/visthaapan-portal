import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { intelligenceRouter } from './intelligence.routes.js';
import { gisRouter } from './gis.routes.js';
import { capacityRouter } from './capacity.routes.js';
import { optimizationRouter } from './optimization.routes.js';
import { allocationsRouter } from './allocations.routes.js';
import { decisionsRouter } from './decisions.routes.js';
import { evidenceRouter } from './evidence.routes.js';
import { commandRouter } from './command.routes.js';
import { scenariosRouter } from './scenarios.routes.js';
import { briefingRouter } from './briefing.routes.js';
import { habitationsRouter } from './habitations.routes.js';
import { sitesRouter } from './sites.routes.js';
import { getApiInfo } from '../controllers/health.controller.js';

export const apiRouter: Router = Router();

// Root API information endpoint (GET /api/v1)
apiRouter.get('/', getApiInfo);

// Health check endpoint (GET /api/v1/health)
apiRouter.use('/', healthRouter);

// Phase 5 AI Intelligence Engine (GET /api/v1/intelligence)
apiRouter.use('/intelligence', intelligenceRouter);

// Phase 6 GIS Spatial Intelligence Engine (GET /api/v1/gis)
apiRouter.use('/gis', gisRouter);

// Phase 7 Capacity Assessment & Bottlenecks Engine (GET /api/v1/capacity)
apiRouter.use('/capacity', capacityRouter);

// Phase 8 Operations Research Allocation Engine (GET/POST /api/v1/optimization)
apiRouter.use('/optimization', optimizationRouter);

// Frontend Allocations Compatibility Gateway (GET/POST /api/v1/allocations)
apiRouter.use('/allocations', allocationsRouter);

// Phase 9 Officer Decisions Workflow & Audit Trail (GET/POST /api/v1/decisions)
apiRouter.use('/decisions', decisionsRouter);

// Phase 9 Chamoli DDMP 2026-27 Evidence & Provenance Registry (GET /api/v1/evidence)
apiRouter.use('/evidence', evidenceRouter);

// Phase 9 Command Center KPIs & Priority Matrix (GET /api/v1/command-center)
apiRouter.use('/command-center', commandRouter);

// Phase 9 Scenario Lab & Dynamic Re-Optimization (GET/POST /api/v1/scenarios)
apiRouter.use('/scenarios', scenariosRouter);

// Phase 9 Incident Commander Briefing Engine (GET/POST /api/v1/briefings)
apiRouter.use('/briefings', briefingRouter);

// Habitations & Relocation Sites Direct Data Access
apiRouter.use('/habitations', habitationsRouter);
apiRouter.use('/sites', sitesRouter);
