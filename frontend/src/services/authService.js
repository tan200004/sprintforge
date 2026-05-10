import forgeApiClient from './api';

export const authService = {
  register: (payload) => forgeApiClient.post('/auth/register', payload),
  login: (payload) => forgeApiClient.post('/auth/login', payload),
  logout: () => forgeApiClient.post('/auth/logout'),
  refreshToken: () => forgeApiClient.post('/auth/refresh'),
  getMe: () => forgeApiClient.get('/auth/me'),
  verifyEmail: (token) => forgeApiClient.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => forgeApiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => forgeApiClient.post(`/auth/reset-password/${token}`, { newPassword }),
};
