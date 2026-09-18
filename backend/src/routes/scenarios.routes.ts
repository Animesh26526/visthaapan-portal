/**
 * VISTHAAPAN Phase 9 Scenario Lab Routes
 * Mounts: /api/v1/scenarios/*
 */

import { Router } from 'express';
import {
  listScenarios,
  createScenario,
  reoptimizeScenarioHandler,
  compareScenario,
} from '../controllers/scenarios.controller.js';

export const scenariosRouter: Router = Router();

// GET /api/v1/scenarios - List all scenarios
scenariosRouter.get('/', listScenarios);

// POST /api/v1/scenarios - Create a scenario
scenariosRouter.post('/', createScenario);

// POST /api/v1/scenarios/reoptimize - Dynamic OR re-solve with overrides
scenariosRouter.post('/reoptimize', reoptimizeScenarioHandler);

// POST /api/v1/scenarios/:id/reoptimize - Dynamic OR re-solve for specific scenario
scenariosRouter.post('/:id/reoptimize', reoptimizeScenarioHandler);

// GET /api/v1/scenarios/:id/compare - Before/After comparison delta
scenariosRouter.get('/:id/compare', compareScenario);
