import rateLimit from 'express-rate-limit';

export const createRateLimiter = (options?: Partial<rateLimit.Options>) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests. Please try again later.',
    ...options
  });
