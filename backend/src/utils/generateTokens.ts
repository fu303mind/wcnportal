import jwt from 'jsonwebtoken';
import env from '@/config/env';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  mfaVerified?: boolean;
}

export const generateAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRATION });

export const generateRefreshToken = (payload: Pick<TokenPayload, 'sub'>) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRATION });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<TokenPayload, 'sub'>;
