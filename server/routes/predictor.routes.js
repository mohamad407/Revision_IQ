import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  createPredictor,
  listPredictors,
  getPredictor,
  updatePredictor,
  uploadPastPaper,
  deletePastPaper,
  generatePrediction,
  deletePredictor,
} from '../controllers/predictor.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  [
    body('subject').isString().trim().notEmpty().withMessage('Subject is required'),
    body('syllabusText').optional().isString(),
    body('pattern').optional().isObject(),
  ],
  validate,
  createPredictor
);

router.get('/', requireAuth, listPredictors);

router.get('/:id', requireAuth, [param('id').isMongoId()], validate, getPredictor);

router.put(
  '/:id',
  requireAuth,
  [
    param('id').isMongoId(),
    body('subject').optional().isString().trim().notEmpty(),
    body('syllabusText').optional().isString(),
    body('pattern').optional().isObject(),
  ],
  validate,
  updatePredictor
);

router.delete('/:id', requireAuth, [param('id').isMongoId()], validate, deletePredictor);

router.post(
  '/:id/papers',
  requireAuth,
  [param('id').isMongoId()],
  validate,
  uploadPdf.single('file'),
  uploadPastPaper
);

router.delete(
  '/:id/papers/:paperId',
  requireAuth,
  [param('id').isMongoId(), param('paperId').isMongoId()],
  validate,
  deletePastPaper
);

router.post('/:id/generate', requireAuth, [param('id').isMongoId()], validate, generatePrediction);

export default router;
