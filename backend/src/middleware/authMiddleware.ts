import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import env from '@/config/env';
import logger from '@/config/logger';

interface TokenPayload {
  sub: string;
  role: string;
  email: string;
  mfaVerified?: boolean;
}

const unauthorized = (res: Response, message = 'Unauthorized') =>
  res.status(StatusCodes.UNAUTHORIZED).json({ message });

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;
  const tokenFromCookie = (req as any).cookies?.accessToken;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return unauthorized(res);
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      mfaVerified: payload.mfaVerified
    };
    return next();
  } catch (error) {
    logger.warn('Invalid auth token', error as Error);
    return unauthorized(res, 'Invalid or expired token');
  }
};

export const authorizeRoles = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return unauthorized(res);
    }

    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden' });
    }

    return next();
  };

export const requireMfa = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.mfaVerified) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'MFA verification required' });
  }

  return next();
};
