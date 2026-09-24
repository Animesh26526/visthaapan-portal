/**
 * VISTHAAPAN Operations & Relocation Planning Routes
 * PS 26191 — Unified Operational API for Relocation Decision-Support
 */

import { Router } from 'express';
import { getRelocationMapOperations } from '../controllers/operations.controller.js';

export const operationsRouter: Router = Router();

// GET /api/v1/operations/relocation-map
// Primary operational endpoint consumed by the redesigned Operational Relocation Planning Map
operationsRouter.get('/relocation-map', getRelocationMapOperations);
