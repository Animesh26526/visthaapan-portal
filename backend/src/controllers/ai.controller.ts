/**
 * VISTHAAPAN AI Controller
 * Exposes endpoints for:
 * - GET  /api/v1/ai/status
 * - POST /api/v1/ai/briefing
 * - POST /api/v1/ai/chat
 */

import { Request, Response, NextFunction } from 'express';
import { LLMService } from '../services/llmService.js';

export async function getAIStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = LLMService.getStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    next(err);
  }
}

export async function generateAIBriefing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { planningState, context, language = 'en', officerContext } = req.body;
    const briefing = await LLMService.generateSituationBrief({
      planningState: planningState || context,
      language: (req.body.language || language || 'en').toString().toLowerCase(),
      officerContext,
    });
    res.json({
      success: true,
      data: briefing,
      brief: briefing.narrativeMarkdown,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleAIChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages = [], currentPlanningContext, language = 'en' } = req.body;
    const userMessage = (req.body.userMessage || req.body.message || '').toString();
    const chatResult = await LLMService.chatAssistant({
      messages,
      userMessage,
      currentPlanningContext,
      language,
    });
    res.json({
      success: true,
      reply: chatResult.reply,
      provider: chatResult.provider,
      model: chatResult.model,
    });
  } catch (err) {
    next(err);
  }
}
