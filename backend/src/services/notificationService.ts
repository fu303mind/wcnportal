import { Server } from 'socket.io';
import Notification, { NotificationDocument } from '@/models/Notification';
import logger from '@/config/logger';

let io: Server | null = null;

export const registerNotificationSocket = (server: Server) => {
  io = server;
};

interface NotificationInput {
  user: string;
  title: string;
  message: string;
  type?: NotificationDocument['type'];
  metadata?: Record<string, unknown>;
}

export const createNotification = async ({ user, title, message, type = 'info', metadata }: NotificationInput) => {
  const notification = await Notification.create({ user, title, message, type, metadata });

  if (io) {
    io.to(user).emit('notification', notification);
  } else {
    logger.warn('Socket.io instance not registered; notification sent only to database');
  }

  return notification;
};

export const markNotificationsRead = async (user: string, notificationIds?: string[]) => {
  const query = { user } as Record<string, unknown>;
  if (notificationIds?.length) {
    query._id = { $in: notificationIds };
  }

  return Notification.updateMany(query, { read: true, readAt: new Date() });
};
