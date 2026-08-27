import api from './axios';

export const getMyChats = () => api.get('/chats');
export const getChatById = (id) => api.get(`/chats/${id}`);
export const getOrCreateSingleChat = (targetUserId) => api.post('/chats/single', { targetUserId });