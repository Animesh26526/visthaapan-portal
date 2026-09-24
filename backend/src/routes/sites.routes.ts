/**
 * VISTHAAPAN Sites Routes
 * Mounts: /api/v1/sites/*
 */

import { Router } from 'express';
import { getSitesList, getSiteById } from '../controllers/sites.controller.js';

export const sitesRouter: Router = Router();

// GET /api/v1/sites - List candidate sites
sitesRouter.get('/', getSitesList);

// GET /api/v1/sites/:id - Get candidate site by ID
sitesRouter.get('/:id', getSiteById);
