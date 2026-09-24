/**
 * VISTHAAPAN Phase 9 AI Routes (Groq Cloud LLM Integration)
 * Mounts: /api/v1/ai/*
 */

import { Router } from 'express';
import { getAIStatus, generateAIBriefing, handleAIChat } from '../controllers/ai.controller.js';

export const aiRouter: Router = Router();

// GET /api/v1/ai/status - Report configured status, provider, and model
aiRouter.get('/status', getAIStatus);

// POST /api/v1/ai/briefing - Generate multilingual structured situation brief
aiRouter.post('/briefing', generateAIBriefing);

// POST /api/v1/ai/chat - Sahayak AI conversational assistant
aiRouter.post('/chat', handleAIChat);
