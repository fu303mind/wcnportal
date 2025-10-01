import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ClientAccount from '@/models/ClientAccount';
import { slugify } from '@/utils/slugify';

export const listClientsController = async (_req: Request, res: Response) => {
  const clients = await ClientAccount.find().sort({ createdAt: -1 });
  return res.status(StatusCodes.OK).json({ clients });
};

export const createClientController = async (req: Request, res: Response) => {
  const { name, industry, status } = req.body;
  const client = await ClientAccount.create({
    name,
    industry,
    status,
    slug: slugify(`${name}-${Date.now()}`),
    primaryContactEmail: req.body.primaryContactEmail
  });
  return res.status(StatusCodes.CREATED).json({ client });
};

export const updateClientController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await ClientAccount.findByIdAndUpdate(id, req.body, { new: true });
  if (!client) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Client not found' });
  }
  return res.status(StatusCodes.OK).json({ client });
};
