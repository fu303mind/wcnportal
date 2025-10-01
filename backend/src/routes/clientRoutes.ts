import { Router } from 'express';
import { body } from 'express-validator';
import {
  createClientController,
  listClientsController,
  updateClientController
} from '@/controllers/clientController';
import { authenticate, authorizeRoles } from '@/middleware/authMiddleware';
import { handleValidation } from '@/middleware/validation';

const router = Router();

router.get('/', authenticate, authorizeRoles('admin', 'manager'), listClientsController);

router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'manager'),
  [body('name').isString().notEmpty(), handleValidation],
  createClientController
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'manager'),
  [body('status').optional().isIn(['active', 'onboarding', 'inactive']), handleValidation],
  updateClientController
);

export default router;
