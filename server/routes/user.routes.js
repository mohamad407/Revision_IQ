import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfile } from '../controllers/user.controller.js';

const router = Router();

router.put(
  '/profile',
  requireAuth,
  [
    body('university').optional().isString().trim().isLength({ max: 200 }),
    body('department').optional().isString().trim().isLength({ max: 200 }),
    body('semester').optional().isString().trim().isLength({ max: 20 }),
  ],
  validate,
  updateProfile
);

export default router;
