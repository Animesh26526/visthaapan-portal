/**
 * VISTHAAPAN Phase 8 Optimization Routes
 * Mounts: /api/v1/optimization/*
 */

import { Router } from 'express';
import {
  runOptimizationHandler,
  getLatestRunHandler,
  listRunsHandler,
  getRunByIdHandler,
  getAllocationsHandler,
  getExplanationsHandler,
  getConstraintsHandler,
} from '../controllers/optimization.controller.js';

export const optimizationRouter: Router = Router();

// Execute OR-Tools optimization run
optimizationRouter.post('/run', runOptimizationHandler);

// Latest optimization run with full allocations, explanations, and constraints
optimizationRouter.get('/runs/latest', getLatestRunHandler);

// Historical optimization runs list
optimizationRouter.get('/runs', listRunsHandler);

// Specific run details
optimizationRouter.get('/runs/:runId', getRunByIdHandler);

// Sub-resource endpoints
optimizationRouter.get('/runs/:runId/allocations', getAllocationsHandler);
optimizationRouter.get('/runs/:runId/explanations', getExplanationsHandler);
optimizationRouter.get('/runs/:runId/constraints', getConstraintsHandler);
