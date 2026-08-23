import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
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
  [body('documentId').isMongoId()],
  validate,
  generateQuizForDocument
);

router.post(
  '/submit',
  requireAuth,
  [
    body('quizId').isMongoId(),
    body('answers').isArray({ min: 1 }),
    body('answers.*.questionIndex').isInt({ min: 0 }),
    body('answers.*.selected').isString(),
  ],
  validate,
  submitQuiz
);

router.get('/history', requireAuth, getQuizHistory);

export default router;
