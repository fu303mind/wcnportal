import { getApiClient } from '@/services/apiClient';

export const listDocuments = async (params?: { workflowId?: string; clientAccountId?: string }) => {
  const api = getApiClient();
  const response = await api.get('/documents', { params });
  return response.data.documents;
};

export const uploadDocument = async (payload: { file: File; workflowId?: string; clientAccountId?: string }) => {
  const api = getApiClient();
  const formData = new FormData();
  formData.append('file', payload.file);
  if (payload.workflowId) formData.append('workflowId', payload.workflowId);
  if (payload.clientAccountId) formData.append('clientAccountId', payload.clientAccountId);
  const response = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.document;
};

export const downloadDocument = async (id: string) => {
  const api = getApiClient();
  const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
  return response.data as Blob;
};

export const deleteDocument = async (id: string) => {
  const api = getApiClient();
  await api.delete(`/documents/${id}`);
};
