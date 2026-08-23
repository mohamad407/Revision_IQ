import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loginOrSync, getAuthProfile } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', requireAuth, loginOrSync);
router.get('/profile', requireAuth, getAuthProfile);

export default router;
