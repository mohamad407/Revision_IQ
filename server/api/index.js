import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../app.js';
import logger from '../utils/logger.js';

// Serverless: reuse ONE connection promise across warm invocations. Caching the
// promise (not a boolean) stops concurrent cold-start requests from each
// opening their own connection and exhausting Atlas limits.
let connecting = null;

function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose
      .connect(process.env.MONGO_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
      .then(() => logger.info('[db] MongoDB connected (serverless)'))
      .catch((err) => {
        connecting = null; // allow retry on next request
        throw err;
      });
  }
  return connecting;
}

export default async function handler(req, res) {
  try {
    await ensureDbConnected();
  } catch (err) {
    logger.error('[db] connection failed:', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
    return;
  }
  return app(req, res);
}
