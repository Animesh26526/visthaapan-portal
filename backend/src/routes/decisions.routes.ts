/**
 * VISTHAAPAN Phase 9 Officer Decisions Routes
 * Mounts: /api/v1/decisions/*
 */

import { Router } from 'express';
import {
  submitOfficerDecision,
  listOfficerDecisions,
  getOfficerDecisionById,
  getDecisionAuditHistory,
} from '../controllers/decisions.controller.js';

export const decisionsRouter: Router = Router();

// GET /api/v1/decisions - List all officer decisions
decisionsRouter.get('/', listOfficerDecisions);

// GET /api/v1/decisions/history - Full audit history ledger
decisionsRouter.get('/history', getDecisionAuditHistory);

// GET /api/v1/decisions/:id - Decision details with audit trail
decisionsRouter.get('/:id', getOfficerDecisionById);

// POST /api/v1/decisions - Submit officer adjudication (ACCEPT, MODIFY, REJECT)
decisionsRouter.post('/', submitOfficerDecision);
