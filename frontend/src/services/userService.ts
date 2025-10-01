import { getApiClient } from '@/services/apiClient';

export const fetchCurrentUser = async () => {
  const api = getApiClient();
  const response = await api.get('/users/me');
  return response.data.user;
};

export const updateProfile = async (payload: { firstName?: string; lastName?: string; preferences?: any }) => {
  const api = getApiClient();
  const response = await api.patch('/users/me', payload);
  return response.data.user;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const api = getApiClient();
  await api.post('/users/me/password', { currentPassword, newPassword });
};

export const listUsers = async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
  const api = getApiClient();
  const response = await api.get('/users', { params });
  return response.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const api = getApiClient();
  const response = await api.patch(`/users/${userId}/role`, { role });
  return response.data.user;
};
