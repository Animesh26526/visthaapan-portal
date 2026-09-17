import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info({
    service: 'VISTHAAPAN API',
    port: config.port,
    prefix: config.apiPrefix,
    environment: config.env,
    frontendOrigin: config.frontendOrigin,
  }, `🚀 VISTHAAPAN Backend Foundation active at http://localhost:${config.port}${config.apiPrefix}`);
});

// Graceful shutdown handling
function handleShutdown(signal: string): void {
  logger.info({ signal }, `Received ${signal}. Gracefully terminating VISTHAAPAN HTTP server...`);
  server.close(() => {
    logger.info('HTTP server terminated successfully. Process exiting.');
    process.exit(0);
  });

  // Force shutdown after 10s if connections linger
  setTimeout(() => {
    logger.error('Forcefully exiting server process after termination timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err, stack: err.stack }, 'Uncaught Exception detected in server process');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, 'Unhandled Rejection detected in server process');
  process.exit(1);
});
