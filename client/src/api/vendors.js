import api from './axios';

export const createVendorProfile = (data) => api.post('/vendors', data);
export const getVendors = (params) => api.get('/vendors', { params });
export const getVendorById = (id) => api.get(`/vendors/${id}`);
export const updateVendorProfile = (id, data) => api.put(`/vendors/${id}`, data);
export const getMyVendorProfile = () => api.get('/vendors/me/profile');