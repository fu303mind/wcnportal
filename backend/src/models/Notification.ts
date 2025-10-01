import mongoose, { Document } from 'mongoose';

export interface NotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info'
    },
    read: { type: Boolean, default: false },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    readAt: Date
  },
  { timestamps: true }
);

const Notification = mongoose.model<NotificationDocument>('Notification', notificationSchema);

export default Notification;
