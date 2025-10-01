import { getApiClient } from '@/services/apiClient';

export const listWorkflows = async (params?: { page?: number; limit?: number; status?: string; clientAccount?: string; search?: string }) => {
  const api = getApiClient();
  const response = await api.get('/workflows', { params });
  return response.data;
};

export const createWorkflow = async (payload: { title: string; description?: string; clientAccount: string; tags?: string[] }) => {
  const api = getApiClient();
  const response = await api.post('/workflows', payload);
  return response.data.workflow;
};

export const getWorkflow = async (id: string) => {
  const api = getApiClient();
  const response = await api.get(`/workflows/${id}`);
  return response.data.workflow;
};

export const updateWorkflow = async (id: string, payload: any) => {
  const api = getApiClient();
  const response = await api.patch(`/workflows/${id}`, payload);
  return response.data.workflow;
};

export const addTask = async (id: string, payload: { title: string; description?: string; assignee?: string; dueDate?: string }) => {
  const api = getApiClient();
  const response = await api.post(`/workflows/${id}/tasks`, payload);
  return response.data.workflow;
};

export const updateTaskStatus = async (workflowId: string, taskId: string, status: string) => {
  const api = getApiClient();
  const response = await api.patch(`/workflows/${workflowId}/tasks/${taskId}/status`, { status });
  return response.data.workflow;
};

export const addTaskComment = async (workflowId: string, taskId: string, message: string) => {
  const api = getApiClient();
  const response = await api.post(`/workflows/${workflowId}/tasks/${taskId}/comments`, { message });
  return response.data.workflow;
};
