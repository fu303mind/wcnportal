import mongoose from 'mongoose';
import env from './env';
import logger from './logger';

mongoose.set('strictQuery', false);

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: env.NODE_ENV === 'test' ? 'client-portal-test' : undefined
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error', error as Error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
};
