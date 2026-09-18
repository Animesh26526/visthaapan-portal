/**
 * VISTHAAPAN Phase 9 Briefing Routes
 * Mounts: /api/v1/briefings/*
 */

import { Router } from 'express';
import { generateBriefing } from '../controllers/briefing.controller.js';

export const briefingRouter: Router = Router();

// POST /api/v1/briefings/generate - Generate authoritative situation brief
briefingRouter.post('/generate', generateBriefing);

// GET /api/v1/briefings/latest - Get latest situation brief
briefingRouter.get('/latest', generateBriefing);
