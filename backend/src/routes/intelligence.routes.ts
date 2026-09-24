import { Router } from 'express';
import {
  listDistrictIntelligence,
  getDistrictIntelligenceDetail,
  getActiveModelInfo,
} from '../controllers/intelligence.controller.js';

export const intelligenceRouter: Router = Router();

// GET /api/v1/intelligence/districts - List district intelligence profiles with operational RPW tiers
intelligenceRouter.get('/districts', listDistrictIntelligence);

// GET /api/v1/intelligence/districts/:districtId - District intelligence detail with SHAP attributions
intelligenceRouter.get('/districts/:districtId', getDistrictIntelligenceDetail);

// GET /api/v1/intelligence/model - Active model version, training metrics, and lineage
intelligenceRouter.get('/model', getActiveModelInfo);
