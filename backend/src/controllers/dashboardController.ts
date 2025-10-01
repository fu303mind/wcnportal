import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getDashboardData } from '@/services/dashboardService';

export const getDashboardController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const data = await getDashboardData(req.user.id);
  res.status(StatusCodes.OK).json(data);
};
