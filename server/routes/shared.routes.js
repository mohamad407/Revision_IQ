import { Router } from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { previewShared } from '../controllers/flashcard.controller.js';

const router = Router();

// PUBLIC (no login): lets a classmate see what a shared deck contains before signing in.
// Only the title, size and 3 sample cards are exposed; copying the deck requires an account.
router.get('/:code', [param('code').matches(/^[A-Za-z0-9_-]{8,16}$/)], validate, previewShared);

export default router;
