import { io } from 'socket.io-client';
import env from './config/env';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(env.VITE_SOCKET_URL, {
    auth: { token }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};