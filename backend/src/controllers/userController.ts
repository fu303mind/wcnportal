import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { changePassword, getUserById, listUsers, updateProfile, updateUserRole } from '@/services/userService';

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const user = await getUserById(req.user.id);
  return res.status(StatusCodes.OK).json({ user });
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const updated = await updateProfile(req.user.id, req.body);
  return res.status(StatusCodes.OK).json({ user: updated });
};

export const changeCurrentPassword = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const { currentPassword, newPassword } = req.body;
  await changePassword(req.user.id, currentPassword, newPassword);
  return res.status(StatusCodes.NO_CONTENT).send();
};

export const adminListUsers = async (req: Request, res: Response) => {
  const { page, limit, search, role } = req.query;
  const result = await listUsers({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search: search as string | undefined,
    role: role as any
  });
  return res.status(StatusCodes.OK).json(result);
};

export const adminUpdateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;
  const user = await updateUserRole(userId, role);
  return res.status(StatusCodes.OK).json({ user });
};
