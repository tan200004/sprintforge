import forgeApiClient from './api';

export const projectService = {
  list:         (params) => forgeApiClient.get('/projects', { params }),
  create:       (data) => forgeApiClient.post('/projects', data),
  getById:      (id) => forgeApiClient.get(`/projects/${id}`),
  update:       (id, data) => forgeApiClient.put(`/projects/${id}`, data),
  delete:       (id) => forgeApiClient.delete(`/projects/${id}`),
  addMember:    (id, data) => forgeApiClient.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => forgeApiClient.delete(`/projects/${id}/members/${userId}`),
};

export const taskService = {
  list:   (params) => forgeApiClient.get('/tasks', { params }),
  create: (data) => forgeApiClient.post('/tasks', data),
  getById:(id) => forgeApiClient.get(`/tasks/${id}`),
  update: (id, data) => forgeApiClient.put(`/tasks/${id}`, data),
  move:   (id, data) => forgeApiClient.put(`/tasks/${id}/move`, data),
  delete: (id) => forgeApiClient.delete(`/tasks/${id}`),
};

export const commentService = {
  getByTask: (taskId) => forgeApiClient.get(`/comments/task/${taskId}`),
  post:      (data) => forgeApiClient.post('/comments', data),
  edit:      (id, body) => forgeApiClient.put(`/comments/${id}`, { body }),
  remove:    (id) => forgeApiClient.delete(`/comments/${id}`),
  react:     (id, emoji) => forgeApiClient.post(`/comments/${id}/react`, { emoji }),
};

export const notificationService = {
  list:       (params) => forgeApiClient.get('/notifications', { params }),
  markRead:   (id) => forgeApiClient.put(`/notifications/${id}/read`),
  markAllRead:() => forgeApiClient.put('/notifications/read-all'),
  delete:     (id) => forgeApiClient.delete(`/notifications/${id}`),
};

export const dashboardService = {
  getMetrics: () => forgeApiClient.get('/dashboard'),
};

export const activityService = {
  getFeed: (params) => forgeApiClient.get('/activity', { params }),
};

export const userService = {
  list:         (params) => forgeApiClient.get('/users', { params }),
  getProfile:   () => forgeApiClient.get('/users/profile'),
  updateProfile:(data) => forgeApiClient.put('/users/profile', data),
  getById:      (id) => forgeApiClient.get(`/users/${id}`),
  changeRole:   (id, newRole) => forgeApiClient.put(`/users/${id}/role`, { newRole }),
  changeStatus: (id, newStatus) => forgeApiClient.put(`/users/${id}/status`, { newStatus }),
};

export const aiService = {
  generateDescription: (data) => forgeApiClient.post('/ai/generate-description', data),
  sprintSummary:       (data) => forgeApiClient.post('/ai/sprint-summary', data),
  explainBug:          (data) => forgeApiClient.post('/ai/explain-bug', data),
  meetingNotes:        (data) => forgeApiClient.post('/ai/meeting-notes', data),
};
