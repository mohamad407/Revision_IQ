import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth, requireUser, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { overview, listUsers, setUserDisabled, listFeedback, resolveFeedback } from '../controllers/admin.controller.js';

const router = Router();
// Every admin route requires: valid login -> existing user -> role === 'admin' (checked in the DB).
router.use(requireAuth, requireUser, requireAdmin);

router.get('/overview', overview);
router.get('/users', listUsers);
router.post('/users/:id/disabled', [param('id').isMongoId(), body('disabled').isBoolean().toBoolean()], validate, setUserDisabled);
router.get('/feedback', listFeedback);
router.post('/feedback/:id/done', [param('id').isMongoId()], validate, resolveFeedback);

export default router;
