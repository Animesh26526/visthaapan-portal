import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { intelligenceRouter } from './intelligence.routes.js';
import { gisRouter } from './gis.routes.js';
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

/**
 * ARCHITECTURAL ROUTE REGISTRATION POINT
 * Future domain routes will be mounted here in subsequent phases:
 *
 * - Phase 3 (Database):
 *   apiRouter.use('/auth', authRouter);
 *   apiRouter.use('/habitations', habitationsRouter);
 *   apiRouter.use('/sites', sitesRouter);
 *
 * - Phase 6 (GIS Engine):
 *   apiRouter.use('/gis', gisRouter);
 *
 * - Phase 8 (OR-Tools Engine):
 *   apiRouter.use('/optimization', optimizationRouter);
 *
 * - Phase 9 (Scenario Engine):
 *   apiRouter.use('/scenarios', scenariosRouter);
 *
 * - Phase 11 (Statutory Adjudication):
 *   apiRouter.use('/decisions', decisionsRouter);
 */
