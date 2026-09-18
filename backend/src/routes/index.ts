import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { intelligenceRouter } from './intelligence.routes.js';
import { gisRouter } from './gis.routes.js';
import { capacityRouter } from './capacity.routes.js';
import { optimizationRouter } from './optimization.routes.js';
import { allocationsRouter } from './allocations.routes.js';
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

