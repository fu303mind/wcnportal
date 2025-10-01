import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import logger from '@/config/logger';

interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export const notFoundHandler = (req: Request, res: Response) =>
  res.status(StatusCodes.NOT_FOUND).json({ message: `Route ${req.originalUrl} not found` });

export const errorHandler: ErrorRequestHandler = (err: ApiError, req, res, _next: NextFunction) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  logger.error('API Error', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.originalUrl,
    method: req.method
  });

  if ((err as any).code === 'EBADCSRFTOKEN') {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Invalid CSRF token' });
  }

  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      errors: err.errors
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: err.message,
      errors: err.errors
    });
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return res.status(StatusCodes.CONFLICT).json({
      message: 'Resource already exists',
      keyValue: (err as any).keyValue
    });
  }

  const response: any = {
    message: err.message || 'Internal server error'
  };
  
  if ((err as any).details) {
    response.details = (err as any).details;
  }
  
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  return res.status(statusCode).json(response);
};
