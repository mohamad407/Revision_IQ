import { Router } from 'express';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { loginOrSync, getAuthProfile } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authLimiter, requireAuth, loginOrSync);
router.get('/profile', requireAuth, requireUser, getAuthProfile);

export default router;
