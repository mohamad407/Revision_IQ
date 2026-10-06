import { Router } from 'express';
import { requireAuth, requireUser } from '../middleware/auth.js';
import { getStats } from '../controllers/stats.controller.js';

const router = Router();
router.get('/', requireAuth, requireUser, getStats);
export default router;
