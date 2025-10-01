import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Notification from '@/models/Notification';
import { markNotificationsRead } from '@/services/notificationService';

export const listNotificationsController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(StatusCodes.OK).json({ notifications });
};

export const markNotificationsController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  await markNotificationsRead(req.user.id, req.body.ids);
  return res.status(StatusCodes.NO_CONTENT).send();
};
