import Feedback from '../models/Feedback.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// POST /api/feedback  { message, page? }
export async function submitFeedback(req, res) {
  try {
    await Feedback.create({
      user: req.user._id,
      email: req.user.email,
      message: req.body.message,
      page: req.body.page || '',
    });
    return ok(res, null, 'Thanks! Your feedback was sent.', 201);
  } catch (err) {
    logger.error('submitFeedback failed:', err);
    return fail(res, 'Failed to send feedback', 500);
  }
}
