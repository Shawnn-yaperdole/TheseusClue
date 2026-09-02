import api from './axios';

export const getMyProjects = (params) => api.get('/projects', { params });
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const toggleFavorite = (id) => api.post(`/projects/${id}/favorite`);
export const toggleOpenToRequests = (id) => api.post(`/projects/${id}/toggle-open`);
export const getOpenProjects = (params) => api.get('/projects/open/browse', { params });
export const getRecommendations = (id) => api.get(`/projects/${id}/recommendations`);