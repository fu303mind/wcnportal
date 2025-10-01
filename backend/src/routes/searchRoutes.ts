import { Router } from 'express';
import { searchController } from '@/controllers/searchController';
import { authenticate } from '@/middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, searchController);

export default router;
