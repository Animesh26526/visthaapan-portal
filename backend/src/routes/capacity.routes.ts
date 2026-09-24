/**
 * VISTHAAPAN Phase 7 Capacity Assessment Routes
 * Mounts: /api/v1/capacity/*
 */

import { Router } from 'express';
import {
  getSitesCapacity,
  getSiteCapacityById,
  getDemandNodes,
  getCapacitySummaryMetrics,
  recalculateCapacities,
} from '../controllers/capacity.controller.js';

export const capacityRouter: Router = Router();

// Candidate relocation sites with bottleneck capacities
capacityRouter.get('/sites', getSitesCapacity);
capacityRouter.get('/sites/:siteId', getSiteCapacityById);

// Relocation demand nodes with RPW and operational tiers
capacityRouter.get('/demand', getDemandNodes);

// Overall capacity summary (demand vs safe capacity, bottleneck distribution)
capacityRouter.get('/summary', getCapacitySummaryMetrics);

// Recalculate capacity assessments and demand nodes
capacityRouter.post('/recalculate', recalculateCapacities);
