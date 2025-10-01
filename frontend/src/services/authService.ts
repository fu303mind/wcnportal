import { getApiClient } from '@/services/apiClient';

export interface LoginPayload {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  clientName?: string;
}

export const login = async (payload: LoginPayload) => {
  const api = getApiClient();
  const response = await api.post('/auth/login', payload);
  return response.data as {
    token?: string;
    refreshToken?: string;
    user?: any;
    mfaRequired?: boolean;
  };
};

export const register = async (payload: RegisterPayload) => {
  const api = getApiClient();
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const logout = async () => {
  const api = getApiClient();
  await api.post('/auth/logout');
};

export const requestPasswordReset = async (email: string) => {
  const api = getApiClient();
  await api.post('/auth/password/forgot', { email });
};

export const resetPassword = async (token: string, password: string) => {
  const api = getApiClient();
  await api.post('/auth/password/reset', { token, password });
};

export const verifyEmail = async (token: string) => {
  const api = getApiClient();
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
};

export const resendVerification = async () => {
  const api = getApiClient();
  await api.post('/auth/resend-verification');
};

export const startMfaSetup = async () => {
  const api = getApiClient();
  const response = await api.post('/auth/mfa/setup');
  return response.data as { secret: string; otpauth: string };
};

export const confirmMfaSetup = async (token: string) => {
  const api = getApiClient();
  const response = await api.post('/auth/mfa/verify', { token });
  return response.data;
};

export const disableMfa = async (password: string) => {
  const api = getApiClient();
  await api.post('/auth/mfa/disable', { password });
};
