import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { io, Socket } from 'socket.io-client';
import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
  startMfaSetup,
  confirmMfaSetup,
  disableMfa
} from '@/services/authService';
import { changePassword, fetchCurrentUser, updateProfile } from '@/services/userService';
import { initializeApiClient, resetApiClient, TokenPair } from '@/services/apiClient';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

interface LoginResponse {
  mfaRequired?: boolean;
  user?: User;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string; mfaCode?: string }) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (payload: { email: string; password: string; firstName: string; lastName: string; role?: string; clientName?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (payload: { firstName?: string; lastName?: string; preferences?: User['preferences'] }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  startMfaSetup: () => Promise<{ secret: string; otpauth: string }>;
  confirmMfaSetup: (token: string) => Promise<void>;
  disableMfa: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'client-portal.auth';

const readStoredTokens = (): TokenPair => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse stored auth tokens', error);
    return { accessToken: null, refreshToken: null };
  }
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<TokenPair>({ accessToken: null, refreshToken: null });
  const [isLoading, setIsLoading] = useState(true);
  const tokensRef = useRef<TokenPair>({ accessToken: null, refreshToken: null });
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const persistTokens = useCallback((nextTokens: TokenPair) => {
    tokensRef.current = nextTokens;
    setTokens(nextTokens);
    if (nextTokens.accessToken && nextTokens.refreshToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTokens));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const establishSocketConnection = useCallback((accessToken?: string | null) => {
    disconnectSocket();
    if (!accessToken) {
      return;
    }
    const socket = io('/', { auth: { token: accessToken }, transports: ['websocket'] });
    socket.on('notification', (notification) => {
      queryClient.setQueryData<any[]>(['notifications'], (existing = []) => [notification, ...existing]);
    });
    socketRef.current = socket;
  }, [disconnectSocket, queryClient]);

  const clearSession = useCallback(async () => {
    persistTokens({ accessToken: null, refreshToken: null });
    setUser(null);
    disconnectSocket();
    await queryClient.clear();
  }, [disconnectSocket, persistTokens, queryClient]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    initializeApiClient({
      getTokens: () => tokensRef.current,
      onTokensUpdated: ({ accessToken, refreshToken }) => {
        persistTokens({ accessToken, refreshToken });
        establishSocketConnection(accessToken);
      },
      onLogout: clearSession
    });

    const stored = readStoredTokens();
    if (stored.accessToken && stored.refreshToken) {
      persistTokens(stored);
      establishSocketConnection(stored.accessToken);
    }

    return () => {
      resetApiClient();
      disconnectSocket();
    };
  }, [clearSession, disconnectSocket, establishSocketConnection, persistTokens]);

  const bootstrapUser = useCallback(async () => {
    if (!tokensRef.current.accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.warn('Failed to load current user', error);
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    bootstrapUser();
  }, [bootstrapUser, tokens.accessToken]);

  const login = useCallback<AuthContextValue['login']>(async (payload) => {
    const response = await loginRequest(payload);
    if (response.mfaRequired) {
      return { mfaRequired: true };
    }

    if (response.token && response.refreshToken && response.user) {
      persistTokens({ accessToken: response.token, refreshToken: response.refreshToken });
      setUser(response.user as User);
      establishSocketConnection(response.token);
      await queryClient.invalidateQueries();
    }

    return { user: response.user as User | undefined };
  }, [establishSocketConnection, persistTokens, queryClient]);

  const register = useCallback<AuthContextValue['register']>(async (payload) => {
    await registerRequest(payload);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokensRef.current.accessToken) {
      return;
    }
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  }, []);

  const updateUserProfile = useCallback<AuthContextValue['updateUserProfile']>(async (payload) => {
    const updated = await updateProfile(payload);
    setUser(updated);
    await queryClient.invalidateQueries(['current-user']);
  }, [queryClient]);

  const changePasswordHandler = useCallback<AuthContextValue['changePassword']>(async (currentPassword, newPassword) => {
    await changePassword(currentPassword, newPassword);
  }, []);

  const requestPasswordResetHandler = useCallback<AuthContextValue['requestPasswordReset']>(async (email) => {
    await requestPasswordReset(email);
  }, []);

  const resetPasswordHandler = useCallback<AuthContextValue['resetPassword']>(async (token, password) => {
    await resetPassword(token, password);
  }, []);

  const verifyEmailHandler = useCallback<AuthContextValue['verifyEmail']>(async (token) => {
    await verifyEmail(token);
    await refreshUser();
  }, [refreshUser]);

  const resendVerificationHandler = useCallback(async () => {
    await resendVerification();
  }, []);

  const startMfaSetupHandler = useCallback(async () => startMfaSetup(), []);
  const confirmMfaSetupHandler = useCallback(async (token: string) => {
    await confirmMfaSetup(token);
    await refreshUser();
  }, [refreshUser]);
  const disableMfaHandler = useCallback(async (password: string) => {
    await disableMfa(password);
    await refreshUser();
  }, [refreshUser]);

  const contextValue = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    register,
    refreshUser,
    updateUserProfile,
    changePassword: changePasswordHandler,
    requestPasswordReset: requestPasswordResetHandler,
    resetPassword: resetPasswordHandler,
    verifyEmail: verifyEmailHandler,
    resendVerification: resendVerificationHandler,
    startMfaSetup: startMfaSetupHandler,
    confirmMfaSetup: confirmMfaSetupHandler,
    disableMfa: disableMfaHandler
  }), [changePasswordHandler, disableMfaHandler, isLoading, login, logout, register, refreshUser, resendVerificationHandler, requestPasswordResetHandler, resetPasswordHandler, startMfaSetupHandler, confirmMfaSetupHandler, updateUserProfile, user, verifyEmailHandler]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider };
