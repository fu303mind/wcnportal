import { getApiClient } from '@/services/apiClient';

export const fetchDashboard = async () => {
  const api = getApiClient();
  const response = await api.get('/dashboard');
  return response.data;
};
