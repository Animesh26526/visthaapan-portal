import express, { type Application } from 'express';
import cors from 'cors';
import type { IncomingMessage, ServerResponse } from 'http';
import { pinoHttp } from 'pino-http';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.js';

export interface AppOptions {
  extraRoutes?: (app: Application) => void;
}

export function createApp(options?: AppOptions): Application {
  const app: Application = express();

  // Disable x-powered-by header for basic security
  app.disable('x-powered-by');

  // 1. Request ID attribution
  app.use(requestIdMiddleware);

  // 2. CORS configuration (bound to configured frontend origin)
  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // 3. HTTP Request logging via Pino
  app.use(
    pinoHttp({
      logger,
      genReqId: (req: IncomingMessage) => ((req as unknown as { id?: string }).id || 'unknown'),
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === `${config.apiPrefix}/health` && config.isProd,
      },
    })
  );

  // 4. Body parsing middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Mount API version router (/api/v1)
  app.use(config.apiPrefix, apiRouter);

  // Allow custom test/extension routes to be registered before 404 handler
  if (options?.extraRoutes) {
    options.extraRoutes(app);
  }

  // 6. Unmatched Route Handler (404)
  app.use(notFoundMiddleware);

  // 7. Centralized Error Handler
  app.use(errorMiddleware);

  return app;
}

export const app: Application = createApp();
