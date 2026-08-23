import { Router } from 'express';
import { param, body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from '../controllers/document.controller.js';

const router = Router();

router.post(
  '/upload',
  requireAuth,
  uploadPdf.single('file'),
  [body('subject').optional().isString().trim().isLength({ max: 200 })],
  validate,
  uploadDocument
);

router.get('/', requireAuth, listDocuments);

router.get('/:id', requireAuth, [param('id').isMongoId()], validate, getDocument);

router.delete('/:id', requireAuth, [param('id').isMongoId()], validate, deleteDocument);

export default router;
