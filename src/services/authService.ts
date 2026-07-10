import { api } from './api';

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data.data);

export const register = (data: { email: string; password: string; name: string; phone?: string; role: string }) =>
  api.post('/auth/register', data).then(r => r.data.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then(r => r.data.data);

export const resetPassword = (email: string, code: string, newPassword: string) =>
  api.post('/auth/reset-password', { email, code, newPassword }).then(r => r.data.data);

export const verifyEmail = (email: string, code: string) =>
  api.post('/auth/verify-email', { email, code }).then(r => r.data.data);

export const refreshToken = (refreshToken: string) =>
  api.post('/auth/refresh', { refreshToken }).then(r => r.data.data);

export const logout = () => api.post('/auth/logout');

export const respondToChallenge = (email: string, newPassword: string, session: string) =>
  api.post('/auth/respond-challenge', { email, newPassword, session }).then(r => r.data.data);
