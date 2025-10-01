import crypto from 'crypto';

export const generateRandomToken = (length = 48): string =>
  crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const generateOtp = (digits = 6): string =>
  crypto.randomInt(0, 10 ** digits).toString().padStart(digits, '0');
