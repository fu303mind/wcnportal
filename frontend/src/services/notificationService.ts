import { getApiClient } from '@/services/apiClient';

export const listNotifications = async () => {
  const api = getApiClient();
  const response = await api.get('/notifications');
  return response.data.notifications;
};

export const markNotificationsRead = async (ids?: string[]) => {
  const api = getApiClient();
  await api.post('/notifications/read', { ids });
};
