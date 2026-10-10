import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfile, deleteAccount } from '../controllers/user.controller.js';

const router = Router();

router.put(
  '/profile',
  requireAuth,
  requireUser,
  [
    body('university').optional().isString().trim().isLength({ max: 200 }),
    body('department').optional().isString().trim().isLength({ max: 200 }),
    body('semester').optional().isString().trim().isLength({ max: 20 }),
    body('language').optional().isIn(['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam']),
    body('dailyGoal').optional().isInt({ min: 1, max: 200 }),
    body('nextExam').optional({ nullable: true }).isObject(),
    body('nextExam.name').optional().isString().trim().isLength({ max: 100 }),
    body('nextExam.date').optional().isISO8601(),
  ],
  validate,
  updateProfile
);

// Permanently deletes the account and all associated data/files.
router.delete('/me', requireAuth, requireUser, deleteAccount);

export default router;
