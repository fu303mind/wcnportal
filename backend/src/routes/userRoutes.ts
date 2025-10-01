import { Router } from 'express';
import { body } from 'express-validator';
import {
  adminListUsers,
  adminUpdateUserRole,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentUser
} from '@/controllers/userController';
import { authenticate, authorizeRoles } from '@/middleware/authMiddleware';
import { handleValidation } from '@/middleware/validation';

const router = Router();

router.get('/me', authenticate, getCurrentUser);

router.patch(
  '/me',
  authenticate,
  [body('firstName').optional().isString(), body('lastName').optional().isString(), handleValidation],
  updateCurrentUser
);

router.post(
  '/me/password',
  authenticate,
  [body('currentPassword').isString(), body('newPassword').isString(), handleValidation],
  changeCurrentPassword
);

router.get('/', authenticate, authorizeRoles('admin'), adminListUsers);

router.patch(
  '/:userId/role',
  authenticate,
  authorizeRoles('admin'),
  [body('role').isString(), handleValidation],
  adminUpdateUserRole
);

export default router;
