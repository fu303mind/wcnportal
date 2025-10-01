import dayjs from 'dayjs';
import mongoose from 'mongoose';
import Workflow from '@/models/Workflow';
import ActivityLog from '@/models/ActivityLog';
import Notification from '@/models/Notification';
import cache from '@/utils/cache';

export const getDashboardData = async (userId: string) => {
  const cacheKey = `dashboard:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const ownerId = new mongoose.Types.ObjectId(userId);

  const [workflowCounts, recentWorkflows, recentActivity, unreadNotifications] = await Promise.all([
    Workflow.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Workflow.find({ owner: ownerId }).sort({ updatedAt: -1 }).limit(5),
    ActivityLog.find({ user: ownerId }).sort({ createdAt: -1 }).limit(10),
    Notification.countDocuments({ user: ownerId, read: false })
  ]);

  const statusMap = workflowCounts.reduce<
    Record<string, number>
  >((acc, item) => ({ ...acc, [item._id as string]: item.count }), {});

  const payload = {
    stats: {
      totalWorkflows: recentWorkflows.length,
      inProgress: statusMap['in_progress'] || 0,
      completed: statusMap['completed'] || 0,
      archived: statusMap['archived'] || 0,
      unreadNotifications
    },
    recentWorkflows,
    recentActivity,
    productivity: Array.from({ length: 7 }).map((_, index) => ({
      date: dayjs().subtract(index, 'day').format('MMM DD'),
      completedTasks: Math.floor(Math.random() * 5)
    }))
  };

  cache.set(cacheKey, payload, 60);
  return payload;
};
