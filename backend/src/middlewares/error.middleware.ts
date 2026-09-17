import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

interface ExpressBodyError extends SyntaxError {
  status?: number;
  statusCode?: number;
  body?: unknown;
}

export function errorMiddleware(
  err: Error | AppError | ExpressBodyError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.id || 'unknown';

  // Handle Express malformed JSON body parse errors
  if (err instanceof SyntaxError && ('status' in err || 'statusCode' in err) && 'body' in err) {
    logger.warn({
      requestId,
      method: req.method,
      url: req.originalUrl,
      error: err.message,
    }, 'Malformed JSON request body received');

    sendError(
      res,
      'MALFORMED_JSON',
      'The request body contains invalid JSON syntax.',
      400
    );
    return;
  }

  // Handle operational application errors
  if (err instanceof AppError) {
    logger.warn({
      requestId,
      method: req.method,
      url: req.originalUrl,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      details: err.details,
    }, `Application error: ${err.message}`);

    sendError(
      res,
      err.code,
      err.message,
      err.statusCode,
      config.isDev ? err.details : undefined
    );
    return;
  }

  // Handle unexpected internal server errors
  logger.error({
    requestId,
    method: req.method,
    url: req.originalUrl,
    errName: err.name,
    errMessage: err.message,
    stack: err.stack,
  }, 'Unhandled internal server error');

  const message = config.isProd
    ? 'An internal server error occurred. Please contact system administrator.'
    : err.message || 'An internal server error occurred';

  const details = config.isDev ? { stack: err.stack } : undefined;

  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    message,
    500,
    details
  );
}
