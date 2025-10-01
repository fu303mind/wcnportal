import ActivityLog from '@/models/ActivityLog';

interface AuditLogInput {
  user?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const recordActivity = async ({
  user,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
  userAgent
}: AuditLogInput) => {
  await ActivityLog.create({
    user,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress,
    userAgent
  });
};
