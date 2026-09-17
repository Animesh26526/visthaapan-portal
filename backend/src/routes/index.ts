import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { getApiInfo } from '../controllers/health.controller.js';

export const apiRouter: Router = Router();

// Root API information endpoint (GET /api/v1)
apiRouter.get('/', getApiInfo);

// Health check endpoint (GET /api/v1/health)
apiRouter.use('/', healthRouter);

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
 * - Phase 11 (Statutory Adjudication & Intelligence):
 *   apiRouter.use('/decisions', decisionsRouter);
 *   apiRouter.use('/intelligence', intelligenceRouter);
 */
