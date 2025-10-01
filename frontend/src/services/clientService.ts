import { getApiClient } from '@/services/apiClient';

export const listClients = async () => {
  const api = getApiClient();
  const response = await api.get('/clients');
  return response.data.clients;
};

export const createClient = async (payload: { name: string; industry?: string; status?: string; primaryContactEmail?: string }) => {
  const api = getApiClient();
  const response = await api.post('/clients', payload);
  return response.data.client;
};

export const updateClient = async (id: string, payload: { name?: string; status?: string; industry?: string; primaryContactEmail?: string }) => {
  const api = getApiClient();
  const response = await api.patch(`/clients/${id}`, payload);
  return response.data.client;
};
