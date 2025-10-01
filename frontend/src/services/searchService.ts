import { getApiClient } from '@/services/apiClient';

export const searchAll = async (query: string) => {
  const api = getApiClient();
  const response = await api.get('/search', { params: { q: query } });
  return response.data as {
    users: any[];
    workflows: any[];
    documents: any[];
  };
};
