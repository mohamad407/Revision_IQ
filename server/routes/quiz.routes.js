import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  generateQuizForDocument,
  submitQuiz,
  getQuizHistory,
} from '../controllers/quiz.controller.js';

const router = Router();

router.post(
  '/generate',
  requireAuth,
  requireUser,
  aiLimiter,
  [body('documentId').isString().isMongoId()],
  validate,
  generateQuizForDocument
);

router.post(
  '/submit',
  requireAuth,
  requireUser,
  [
    body('quizId').isString().isMongoId(),
    body('answers').isArray({ min: 1, max: 20 }),
    body('answers.*.questionIndex').isInt({ min: 0, max: 19 }).toInt(),
    body('answers.*.selected').isString().isLength({ max: 1000 }),
  ],
  validate,
  submitQuiz
);

router.get('/history', requireAuth, requireUser, getQuizHistory);

export default router;
