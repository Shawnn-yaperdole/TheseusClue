import { io } from 'socket.io-client';
import env from './config/env';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(env.SOCKET_URL, {
    auth: { token }
  });

  socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
  socket.on('connect_error', (err) => console.error('❌ Socket connect_error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};