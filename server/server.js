import dns from 'node:dns/promises';
import 'dotenv/config';
import mongoose from 'mongoose';
import { assertEnv } from './utils/env.js';
import logger from './utils/logger.js';

// Only force public DNS locally; never override system DNS in production.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    assertEnv(); // fail fast with a clear message

    // Imported after env validation: these modules read env at load time.
    const { default: app } = await import('./app.js');
    const { default: connectDB } = await import('./config/db.js');

    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`RevisionIQ API listening on port ${PORT}`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(`Failed to start: ${error.message}`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));

start();
