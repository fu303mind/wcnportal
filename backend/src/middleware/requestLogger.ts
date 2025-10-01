import morgan from 'morgan';
import logger from '@/config/logger';

const stream = {
  write: (message: string) => logger.info(message.trim())
};

const skip = () => process.env.NODE_ENV === 'test';

export const requestLogger = morgan('combined', { stream, skip });
