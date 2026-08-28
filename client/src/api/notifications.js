import api from './axios';

export const getMyNotifications = () => api.get('/notifications');
export const markAsRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllAsRead = () => api.post('/notifications/read-all');