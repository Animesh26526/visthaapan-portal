/**
 * VISTHAAPAN Phase 9 Command Center Routes
 * Mounts: /api/v1/command-center/*
 */

import { Router } from 'express';
import { getCommandCenterSummary, getCommandCenterDistricts } from '../controllers/command.controller.js';

export const commandRouter: Router = Router();

// GET /api/v1/command-center/summary - Live database-derived operational KPIs
commandRouter.get('/summary', getCommandCenterSummary);

// GET /api/v1/command-center/districts - Monitored priority districts summary
commandRouter.get('/districts', getCommandCenterDistricts);
