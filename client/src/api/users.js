import api from './axios';

export const updateMyProfile = (data) => api.put('/users/me', data);
export const getUserProfile = (id) => api.get(`/users/${id}`);