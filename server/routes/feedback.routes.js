import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { feedbackLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { submitFeedback } from '../controllers/feedback.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireUser,
  feedbackLimiter,
  [
    body('message').isString().trim().isLength({ min: 5, max: 2000 }).withMessage('Please write at least 5 characters.'),
    body('page').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  submitFeedback
);

export default router;
