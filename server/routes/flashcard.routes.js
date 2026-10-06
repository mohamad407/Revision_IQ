import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { generateForDocument, getDueCards, reviewCard } from '../controllers/flashcard.controller.js';

const router = Router();
const auth = [requireAuth, requireUser];

router.post('/generate', ...auth, aiLimiter, [body('documentId').isString().isMongoId()], validate, generateForDocument);
router.get('/due', ...auth, getDueCards);
router.post(
  '/:id/review',
  ...auth,
  [param('id').isMongoId(), body('rating').isInt({ min: 0, max: 3 }).toInt()],
  validate,
  reviewCard
);

export default router;
