import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { generateForDocument, getDueCards, reviewCard, shareDeck, unshareDeck, importShared } from '../controllers/flashcard.controller.js';

const router = Router();
const auth = [requireAuth, requireUser];

router.post('/generate', ...auth, aiLimiter, [body('documentId').isString().isMongoId()], validate, generateForDocument);
router.get('/due', ...auth, getDueCards);
router.post('/share', ...auth, [body('documentId').isString().isMongoId()], validate, shareDeck);
router.delete('/share/:code', ...auth, [param('code').matches(/^[A-Za-z0-9_-]{8,16}$/)], validate, unshareDeck);
router.post('/import', ...auth, [body('code').isString().matches(/^[A-Za-z0-9_-]{8,16}$/)], validate, importShared);
router.post(
  '/:id/review',
  ...auth,
  [param('id').isMongoId(), body('rating').isInt({ min: 0, max: 3 }).toInt()],
  validate,
  reviewCard
);

export default router;
