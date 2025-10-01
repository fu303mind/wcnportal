import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import env from '@/config/env';
import {
  disableMfa,
  initiateMfaSetup,
  initiatePasswordReset,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  verifyMfaSetup
} from '@/services/authService';
import User from '@/models/User';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
};

export const register = async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(StatusCodes.CREATED).json({ user });
};

export const login = async (req: Request, res: Response) => {
  const { email, password, mfaCode } = req.body;
  const result = await loginUser(email, password, mfaCode);

  if (result.mfaRequired) {
    return res.status(StatusCodes.OK).json({ mfaRequired: true });
  }

  if (!result.accessToken || !result.refreshToken || !result.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication failed' });
  }

  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(StatusCodes.OK).json({
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user
  });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Refresh token missing' });
  }

  const { accessToken, refreshToken: newRefreshToken } = await refreshTokens(refreshToken);
  setAuthCookies(res, accessToken, newRefreshToken);
  res.status(StatusCodes.OK).json({ token: accessToken, refreshToken: newRefreshToken });
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (req.user) {
    await logoutUser(req.user.id, refreshToken);
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(StatusCodes.NO_CONTENT).send();
};

export const resendVerification = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const userDoc = await User.findById(req.user.id);
  if (!userDoc) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
  }

  if (userDoc.isEmailVerified) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email already verified' });
  }

  await sendEmailVerification(userDoc);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const verifyEmailAddress = async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = await verifyEmail(token);
  res.status(StatusCodes.OK).json({ user });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  await initiatePasswordReset(email);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const completePasswordReset = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const user = await resetPassword(token, password);
  res.status(StatusCodes.OK).json({ user });
};

export const startMfaSetup = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const data = await initiateMfaSetup(req.user.id);
  res.status(StatusCodes.OK).json(data);
};

export const confirmMfaSetup = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const { token } = req.body;
  const user = await verifyMfaSetup(req.user.id, token);
  res.status(StatusCodes.OK).json({ user });
};

export const removeMfa = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const { password } = req.body;
  await disableMfa(req.user.id, password);
  res.status(StatusCodes.NO_CONTENT).send();
};
