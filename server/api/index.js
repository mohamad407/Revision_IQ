import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../app.js';
import logger from '../utils/logger.js';

// Serverless functions can be invoked many times against a warm container —
// reuse the Mongo connection across invocations instead of reconnecting
// on every request (which would exhaust Atlas connections fast).
let isConnected = false;

async function ensureDbConnected() {
  if (isConnected) return;
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  logger.info('[db] MongoDB connected (serverless)');
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
