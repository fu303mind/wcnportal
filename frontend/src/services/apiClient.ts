import axios, { AxiosError, AxiosInstance } from 'axios';

type TokenPair = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthHandlers = {
  getTokens: () => TokenPair;
  onTokensUpdated: (tokens: { accessToken: string; refreshToken: string }) => void;
  onLogout: () => Promise<void> | void;
};

const CSRF_HEADER = 'X-CSRF-Token';
const methodsRequiringCsrf = new Set(['post', 'put', 'patch', 'delete']);

let csrfToken: string | null = null;
let initialized = false;
let authHandlers: AuthHandlers | null = null;

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true,
  timeout: 15000
});

const fetchCsrfToken = async () => {
  // CSRF token temporarily disabled
  // const response = await axios.get<{ csrfToken: string }>('http://localhost:5001/api/csrf-token', { withCredentials: true });
  // csrfToken = response.data.csrfToken;
  return csrfToken;
};

const ensureCsrfToken = async () => {
  // CSRF token temporarily disabled
  // if (!csrfToken) {
  //   await fetchCsrfToken();
  // }
  return csrfToken;
};

api.interceptors.request.use(async (config) => {
  if (!config.headers) {
    config.headers = {} as any;
  }

  // CSRF token temporarily disabled
  // const method = (config.method || 'get').toLowerCase();
  // if (methodsRequiringCsrf.has(method)) {
  //   const token = await ensureCsrfToken();
  //   if (token) {
  //     config.headers[CSRF_HEADER] = token;
  //   }
  // }

  if (authHandlers) {
    const { accessToken } = authHandlers.getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  if (!authHandlers) {
    return Promise.reject(error);
  }

  const originalRequest: any = error.config;
  if (!originalRequest) {
    return Promise.reject(error);
  }

  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const { refreshToken } = authHandlers.getTokens();
      if (!refreshToken) {
        await authHandlers.onLogout();
        return Promise.reject(error);
      }

      const refreshResponse = await axios.post<{ token: string; refreshToken: string }>('/api/auth/refresh', { refreshToken }, {
        withCredentials: true,
        headers: { [CSRF_HEADER]: await ensureCsrfToken() }
      });

      authHandlers.onTokensUpdated({
        accessToken: refreshResponse.data.token,
        refreshToken: refreshResponse.data.refreshToken
      });

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
      return api.request(originalRequest);
    } catch (refreshError) {
      await authHandlers.onLogout();
      return Promise.reject(refreshError);
    }
  }

  if (error.response?.status === 403 && (error.response.data as any)?.message === 'Invalid CSRF token') {
    csrfToken = null;
  }

  return Promise.reject(error);
});

export const initializeApiClient = (handlers: AuthHandlers) => {
  authHandlers = handlers;
  initialized = true;
};

export const resetApiClient = () => {
  authHandlers = null;
  csrfToken = null;
  initialized = false;
};

export const getApiClient = () => {
  if (!initialized) {
    throw new Error('API client not initialized. initializeApiClient must be called before use.');
  }
  return api;
};

export const clearCsrfToken = () => {
  csrfToken = null;
};

export type { TokenPair };
