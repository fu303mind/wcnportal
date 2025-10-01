import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import Document from '@/models/Document';
import env from '@/config/env';
import { recordActivity } from './auditService';

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'text/plain'
];

export const storeDocument = async ({
  file,
  userId,
  workflowId,
  clientAccountId
}: {
  file: Express.Multer.File;
  userId: string;
  workflowId?: string;
  clientAccountId?: string;
}) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    fs.promises.unlink(file.path).catch(() => undefined);
    const error: any = new Error('Unsupported file type');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  if (file.size > env.MAX_FILE_SIZE_MB * 1024 * 1024) {
    fs.promises.unlink(file.path).catch(() => undefined);
    const error: any = new Error('File too large');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const buffer = await fs.promises.readFile(file.path);
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

  const storagePath = path.relative(process.cwd(), file.path);

  const document = await Document.create({
    originalName: file.originalname,
    fileName: path.basename(file.path),
    mimeType: file.mimetype,
    size: file.size,
    owner: userId,
    workflow: workflowId,
    clientAccount: clientAccountId,
    storagePath,
    checksum
  });

  await recordActivity({
    user: userId,
    action: 'document_uploaded',
    entityType: 'document',
    entityId: document._id.toString(),
    metadata: { originalName: file.originalname }
  });

  return document;
};

export const listDocuments = async (userId: string, filters?: { workflowId?: string; clientAccountId?: string }) => {
  const query: Record<string, unknown> = { owner: userId };
  if (filters?.workflowId) query.workflow = filters.workflowId;
  if (filters?.clientAccountId) query.clientAccount = filters.clientAccountId;
  return Document.find(query).sort({ createdAt: -1 });
};

export const getDocument = async (documentId: string, userId: string) => {
  const document = await Document.findById(documentId);
  if (!document) {
    const error: any = new Error('Document not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  if (document.owner.toString() !== userId) {
    const error: any = new Error('You do not have access to this document');
    error.statusCode = StatusCodes.FORBIDDEN;
    throw error;
  }

  const absolutePath = path.resolve(document.storagePath);
  return { document, absolutePath };
};

export const deleteDocument = async (documentId: string, userId: string) => {
  const document = await Document.findById(documentId);
  if (!document) {
    const error: any = new Error('Document not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  if (document.owner.toString() !== userId) {
    const error: any = new Error('You do not have access to this document');
    error.statusCode = StatusCodes.FORBIDDEN;
    throw error;
  }

  const absolutePath = path.resolve(document.storagePath);
  await document.deleteOne();

  await fs.promises.unlink(absolutePath).catch(() => undefined);

  await recordActivity({
    user: userId,
    action: 'document_deleted',
    entityType: 'document',
    entityId: documentId
  });
};
