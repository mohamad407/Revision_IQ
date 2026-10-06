import { Router } from 'express';
import { param, body } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { uploadPdf, verifyFileSignature } from '../middleware/upload.js';
import { uploadLimiter, aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  regenerateSummary,
} from '../controllers/document.controller.js';

const router = Router();

// Order matters: auth + limits BEFORE multer, so unauthenticated or
// over-quota requests never get to push a 20MB body into memory.
router.post(
  '/upload',
  requireAuth,
  requireUser,
  uploadLimiter,
  aiLimiter,
  uploadPdf.single('file'),
  verifyFileSignature,
  [body('subject').optional().isString().trim().isLength({ max: 200 })],
  validate,
  uploadDocument
);

router.get('/', requireAuth, requireUser, listDocuments);
router.get('/:id', requireAuth, requireUser, [param('id').isMongoId()], validate, getDocument);
router.post('/:id/summary', requireAuth, requireUser, aiLimiter, [param('id').isMongoId()], validate, regenerateSummary);
router.delete('/:id', requireAuth, requireUser, [param('id').isMongoId()], validate, deleteDocument);

export default router;
