import jwt, { SignOptions } from 'jsonwebtoken';
import env from '@/config/env';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  mfaVerified?: boolean;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRATION } as SignOptions);
};

export const generateRefreshToken = (payload: Pick<TokenPayload, 'sub'>): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRATION } as SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): Pick<TokenPayload, 'sub'> => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<TokenPayload, 'sub'>;
};
