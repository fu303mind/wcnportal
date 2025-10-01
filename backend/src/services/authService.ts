import { authenticator } from 'otplib';
import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import User, { UserDocument, UserRole } from '@/models/User';
import Token from '@/models/Token';
import ClientAccount from '@/models/ClientAccount';
import env from '@/config/env';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/generateTokens';
import { generateRandomToken, hashToken } from '@/utils/crypto';
import { validatePassword } from '@/utils/passwordPolicy';
import { slugify } from '@/utils/slugify';
import { sendEmail } from './emailService';
import { recordActivity } from './auditService';
import logger from '@/config/logger';
import { parseDuration } from '@/utils/duration';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const refreshDuration = parseDuration(env.JWT_REFRESH_EXPIRATION);

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  clientName?: string;
}

export const registerUser = async (input: RegisterInput) => {
  const { email, password, firstName, lastName, role = 'client', clientName } = input;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    const error: any = new Error(passwordCheck.message);
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  if (await User.isEmailTaken(email)) {
    const error: any = new Error('Email already in use');
    error.statusCode = StatusCodes.CONFLICT;
    throw error;
  }

  let clientAccountId;
  if (role === 'client') {
    const name = clientName || `${firstName} ${lastName}`;
    const slug = slugify(`${name}-${Date.now()}`);
    const client = await ClientAccount.create({
      name,
      slug,
      status: 'onboarding',
      primaryContactEmail: email
    });
    clientAccountId = client._id;
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role,
    clientAccount: clientAccountId
  });

  await sendEmailVerification(user);

  await recordActivity({
    user: user._id.toString(),
    action: 'user_registered',
    metadata: { role }
  });

  return user.toJSON();
};

export const sendEmailVerification = async (user: UserDocument) => {
  const rawToken = generateRandomToken(48);
  const hashed = hashToken(rawToken);

  await Token.create({
    user: user._id,
    token: hashed,
    type: 'email_verification',
    expiresAt: dayjs().add(env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS, 'hour').toDate()
  });

  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify your account',
    html: `
      <p>Hello ${user.firstName},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email</a></p>
      <p>This link will expire in ${env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS} hours.</p>
    `
  });
};

export const verifyEmail = async (token: string) => {
  const hashed = hashToken(token);
  const storedToken = await Token.findOne({ token: hashed, type: 'email_verification' }).populate('user');

  if (!storedToken || dayjs(storedToken.expiresAt).isBefore(dayjs())) {
    const error: any = new Error('Token invalid or expired');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  if (!storedToken.user || typeof storedToken.user === 'string' || !('email' in storedToken.user)) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const user = storedToken.user as unknown as UserDocument;
  user.isEmailVerified = true;
  await user.save();

  storedToken.consumedAt = new Date();
  await storedToken.save();

  await recordActivity({
    user: user._id.toString(),
    action: 'email_verified'
  });

  return user.toJSON();
};

interface LoginResult {
  accessToken?: string;
  refreshToken?: string;
  user?: ReturnType<UserDocument['toJSON']>;
  mfaRequired?: boolean;
}

export const loginUser = async (email: string, password: string, mfaCode?: string): Promise<LoginResult> => {
  const user = await User.findOne({ email })
    .select('+password +mfaSecret')
    .populate('clientAccount');

  if (!user) {
    const error: any = new Error('Invalid credentials');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  if (user.lockoutUntil && dayjs(user.lockoutUntil).isAfter(dayjs())) {
    const minutesRemaining = dayjs(user.lockoutUntil).diff(dayjs(), 'minute');
    const error: any = new Error(`Account locked. Try again in ${minutesRemaining} minutes.`);
    error.statusCode = StatusCodes.LOCKED;
    throw error;
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockoutUntil = dayjs().add(LOCKOUT_MINUTES, 'minute').toDate();
    }
    await user.save();
    const error: any = new Error('Invalid credentials');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    user.resetLocks();
  }

  if (user.mfaEnabled) {
    if (!mfaCode) {
      return { mfaRequired: true };
    }

    const isValid = user.mfaSecret
      ? authenticator.check(mfaCode, user.mfaSecret)
      : false;

    if (!isValid) {
      const error: any = new Error('Invalid MFA code');
      error.statusCode = StatusCodes.UNAUTHORIZED;
      throw error;
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    ...(user.mfaEnabled ? { mfaVerified: true } : {})
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ sub: user._id.toString() });

  await Token.create({
    user: user._id,
    token: hashToken(refreshToken),
    type: 'refresh_token',
    expiresAt: dayjs().add(refreshDuration.value, refreshDuration.unit).toDate()
  });

  await recordActivity({
    user: user._id.toString(),
    action: 'user_logged_in'
  });

  return {
    accessToken,
    refreshToken,
    user: user.toJSON()
  };
};

export const refreshTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const hashed = hashToken(refreshToken);
  const stored = await Token.findOne({ token: hashed, type: 'refresh_token' });

  if (!stored) {
    const error: any = new Error('Invalid refresh token');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  if (dayjs(stored.expiresAt).isBefore(dayjs())) {
    await stored.deleteOne();
    const error: any = new Error('Refresh token expired');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    await stored.deleteOne();
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    ...(user.mfaEnabled ? { mfaVerified: true } : {})
  });

  await stored.deleteOne();
  const newRefresh = generateRefreshToken({ sub: user._id.toString() });
  await Token.create({
    user: user._id,
    token: hashToken(newRefresh),
    type: 'refresh_token',
    expiresAt: dayjs().add(refreshDuration.value, refreshDuration.unit).toDate()
  });

  return { accessToken, refreshToken: newRefresh };
};

export const logoutUser = async (userId: string, refreshToken?: string) => {
  if (refreshToken) {
    await Token.deleteOne({ token: hashToken(refreshToken), type: 'refresh_token' });
  } else {
    await Token.deleteMany({ user: userId, type: 'refresh_token' });
  }
};

export const initiatePasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn('Password reset requested for unknown email', { email });
    return;
  }

  const rawToken = generateRandomToken(48);
  const hashed = hashToken(rawToken);

  await Token.create({
    user: user._id,
    token: hashed,
    type: 'password_reset',
    expiresAt: dayjs().add(env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES, 'minute').toDate()
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password reset instructions',
    html: `
      <p>Hello ${user.firstName},</p>
      <p>We received a request to reset your password. Use the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request this, please contact support.</p>
    `
  });

  await recordActivity({
    user: user._id.toString(),
    action: 'password_reset_requested'
  });
};

export const resetPassword = async (token: string, newPassword: string) => {
  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) {
    const error: any = new Error(passwordCheck.message);
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const hashed = hashToken(token);
  const storedToken = await Token.findOne({ token: hashed, type: 'password_reset' });

  if (!storedToken || dayjs(storedToken.expiresAt).isBefore(dayjs())) {
    const error: any = new Error('Token invalid or expired');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const user = await User.findById(storedToken.user).select('+password');
  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  user.password = newPassword;
  user.resetLocks();
  await user.save();

  storedToken.consumedAt = new Date();
  await storedToken.save();

  await Token.deleteMany({ user: user._id, type: 'refresh_token' });

  await recordActivity({
    user: user._id.toString(),
    action: 'password_reset_completed'
  });

  return user.toJSON();
};

export const initiateMfaSetup = async (userId: string) => {
  const user = await User.findById(userId).select('+mfaSecret');
  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const secret = authenticator.generateSecret();
  user.mfaSecret = secret;
  await user.save();

  const otpauth = authenticator.keyuri(user.email, env.MFA_ISSUER, secret);

  return { secret, otpauth }; // Client can generate QR from otpauth
};

export const verifyMfaSetup = async (userId: string, token: string) => {
  const user = await User.findById(userId).select('+mfaSecret');
  if (!user || !user.mfaSecret) {
    const error: any = new Error('MFA not initialized');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  if (!authenticator.check(token, user.mfaSecret)) {
    const error: any = new Error('Invalid MFA token');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  user.mfaEnabled = true;
  await user.save();

  await recordActivity({
    user: user._id.toString(),
    action: 'mfa_enabled'
  });

  return user.toJSON();
};

export const disableMfa = async (userId: string, password: string) => {
  const user = await User.findById(userId).select('+password +mfaSecret');
  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    const error: any = new Error('Invalid password');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  await user.save();

  await recordActivity({
    user: user._id.toString(),
    action: 'mfa_disabled'
  });
};
