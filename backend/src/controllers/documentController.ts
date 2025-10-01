import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import fs from 'fs';
import { deleteDocument, getDocument, listDocuments, storeDocument } from '@/services/documentService';

export const uploadDocumentController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const file = req.file;
  if (!file) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'File is required' });
  }

  const document = await storeDocument({
    file,
    userId: req.user.id,
    workflowId: req.body.workflowId,
    clientAccountId: req.body.clientAccountId
  });

  return res.status(StatusCodes.CREATED).json({ document });
};

export const listDocumentsController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const documents = await listDocuments(req.user.id, {
    workflowId: req.query.workflowId as string | undefined,
    clientAccountId: req.query.clientAccountId as string | undefined
  });

  return res.status(StatusCodes.OK).json({ documents });
};

export const downloadDocumentController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  const { document, absolutePath } = await getDocument(req.params.id, req.user.id);
  const fileStream = fs.createReadStream(absolutePath);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
  return fileStream.pipe(res);
};

export const deleteDocumentController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }

  await deleteDocument(req.params.id, req.user.id);
  return res.status(StatusCodes.NO_CONTENT).send();
};
