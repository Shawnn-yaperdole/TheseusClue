import axios from 'axios';
import env from '../config/env';

const api = axios.create({
  baseURL: env.API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;