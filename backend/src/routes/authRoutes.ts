import { Router } from 'express';
import { body } from 'express-validator';
import {
  confirmMfaSetup,
  completePasswordReset,
  login,
  logout,
  refresh,
  register,
  removeMfa,
  resendVerification,
  requestPasswordReset,
  startMfaSetup,
  verifyEmailAddress
} from '@/controllers/authController';
import { handleValidation } from '@/middleware/validation';
import { authenticate } from '@/middleware/authMiddleware';
import { createRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

const loginLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isString(),
    body('firstName').isString().notEmpty(),
    body('lastName').isString().notEmpty(),
    handleValidation
  ],
  register
);

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail(), body('password').isString(), handleValidation],
  login
);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);

router.post('/verify-email', [body('token').isString(), handleValidation], verifyEmailAddress);
router.post('/password/forgot', [body('email').isEmail(), handleValidation], requestPasswordReset);
router.post(
  '/password/reset',
  [body('token').isString(), body('password').isString(), handleValidation],
  completePasswordReset
);

router.post('/mfa/setup', authenticate, startMfaSetup);
router.post('/mfa/verify', authenticate, [body('token').isString(), handleValidation], confirmMfaSetup);
router.post('/mfa/disable', authenticate, [body('password').isString(), handleValidation], removeMfa);
router.post('/resend-verification', authenticate, resendVerification);

export default router;
