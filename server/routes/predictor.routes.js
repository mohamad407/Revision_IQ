import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { uploadPastPaperFile, verifyFileSignature } from '../middleware/upload.js';
import { aiLimiter, uploadLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { LIMITS } from '../utils/pattern.js';
import {
  createPredictor,
  listPredictors,
  getPredictor,
  updatePredictor,
  uploadPastPaper,
  deletePastPaper,
  generatePrediction,
  generateModelPaperForSession,
  generateImportantTopicsForSession,
  deletePredictor,
} from '../controllers/predictor.controller.js';

const router = Router();
const auth = [requireAuth, requireUser];
const id = param('id').isMongoId();

const fieldRules = (required) => [
  required
    ? body('subject').isString().trim().notEmpty().isLength({ max: 200 }).withMessage('Subject is required (max 200 chars)')
    : body('subject').optional().isString().trim().notEmpty().isLength({ max: 200 }),
  body('syllabusText').optional().isString().isLength({ max: LIMITS.maxSyllabusChars }),
  body('pattern').optional().isObject(),
];

router.post('/', ...auth, fieldRules(true), validate, createPredictor);
router.get('/', ...auth, listPredictors);
router.get('/:id', ...auth, [id], validate, getPredictor);
router.put('/:id', ...auth, [id, ...fieldRules(false)], validate, updatePredictor);
router.delete('/:id', ...auth, [id], validate, deletePredictor);

// multer first so multipart text fields (stage) are parsed, then validate them.
router.post(
  '/:id/papers',
  ...auth,
  uploadLimiter,
  aiLimiter,
  [id],
  validate,
  uploadPastPaperFile.single('file'),
  verifyFileSignature,
  [body('stage').optional().isIn(['cat1', 'cat2', 'fat', 'unspecified'])],
  validate,
  uploadPastPaper
);

router.delete('/:id/papers/:paperId', ...auth, [id, param('paperId').isMongoId()], validate, deletePastPaper);

router.post('/:id/generate', ...auth, aiLimiter, [id], validate, generatePrediction);
router.post('/:id/model-paper', ...auth, aiLimiter, [id], validate, generateModelPaperForSession);
router.post('/:id/important-topics', ...auth, aiLimiter, [id], validate, generateImportantTopicsForSession);

export default router;
