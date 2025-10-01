import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { searchAll } from '@/services/searchService';

export const searchController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const query = (req.query.q as string) || '';
  if (!query) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Search query is required' });
  }

  const results = await searchAll(req.user.id, query);
  return res.status(StatusCodes.OK).json(results);
};
