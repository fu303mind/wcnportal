import { Router } from 'express';
import { body } from 'express-validator';
import { listNotificationsController, markNotificationsController } from '@/controllers/notificationController';
import { authenticate } from '@/middleware/authMiddleware';
import { handleValidation } from '@/middleware/validation';

const router = Router();

router.get('/', authenticate, listNotificationsController);
router.post('/read', authenticate, [body('ids').optional().isArray(), handleValidation], markNotificationsController);

export default router;
