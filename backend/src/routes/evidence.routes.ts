/**
 * VISTHAAPAN Phase 9 Evidence & Provenance Routes
 * Mounts: /api/v1/evidence/*
 */

import { Router } from 'express';
import { getDistrictEvidence, getProvenanceRegistry } from '../controllers/evidence.controller.js';

export const evidenceRouter: Router = Router();

// GET /api/v1/evidence/provenance - System-wide provenance registry
evidenceRouter.get('/provenance', getProvenanceRegistry);

// GET /api/v1/evidence/ddmp/:districtId - Chamoli DDMP 2026-27 structured documentary knowledge
evidenceRouter.get('/ddmp/:districtId', getDistrictEvidence);
