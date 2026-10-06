import Activity from '../models/Activity.js';
import { dayKey } from '../utils/day.js';
import logger from '../utils/logger.js';

// Fire-and-forget safe: a failure to log activity must never break a quiz or review.
export async function logActivity(userId, tzOffset, { quizzes = 0, cards = 0 }) {
  try {
    await Activity.updateOne(
      { user: userId, day: dayKey(tzOffset) },
      { $inc: { quizzes, cards } },
      { upsert: true }
    );
  } catch (err) {
    logger.error('logActivity failed:', err);
  }
}
