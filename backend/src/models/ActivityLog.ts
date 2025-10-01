import mongoose, { Document } from 'mongoose';

export interface ActivityLogDocument extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new mongoose.Schema<ActivityLogDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: String,
    entityId: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model<ActivityLogDocument>('ActivityLog', activityLogSchema);

export default ActivityLog;
