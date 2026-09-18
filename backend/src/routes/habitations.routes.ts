/**
 * VISTHAAPAN Habitations Routes
 * Mounts: /api/v1/habitations/*
 */

import { Router } from 'express';
import { getHabitationsList, getHabitationById } from '../controllers/habitations.controller.js';

export const habitationsRouter: Router = Router();

// GET /api/v1/habitations - List monitored habitations
habitationsRouter.get('/', getHabitationsList);

// GET /api/v1/habitations/:id - Get habitation by ID
habitationsRouter.get('/:id', getHabitationById);
