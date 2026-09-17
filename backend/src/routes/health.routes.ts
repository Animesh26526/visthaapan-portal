import { Router } from 'express';
import { getHealthCheck } from '../controllers/health.controller.js';

export const healthRouter: Router = Router();

healthRouter.get('/health', getHealthCheck);
