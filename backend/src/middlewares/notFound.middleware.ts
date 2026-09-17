import type { Request, Response } from 'express';
import { sendError } from '../utils/response.js';

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(
    res,
    'NOT_FOUND',
    `Resource not found: cannot ${req.method} ${req.originalUrl}`,
    404
  );
}
