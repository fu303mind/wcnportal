import { Router } from 'express';
import { authenticate } from '@/middleware/authMiddleware';
import { getDashboardController } from '@/controllers/dashboardController';

const router = Router();

router.get('/', authenticate, getDashboardController);

export default router;
