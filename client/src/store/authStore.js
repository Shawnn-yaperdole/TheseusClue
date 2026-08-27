import { create } from 'zustand';
import { getCurrentUser } from '../api/auth';
import { connectSocket, disconnectSocket } from '../socket';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: true, // true until we've checked for an existing session

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    connectSocket(token);
    set({ user, token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null, isLoading: false });
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await getCurrentUser();
      connectSocket(token);
      set({ user: res.data, token, isLoading: false });
    } catch (err) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false });
    }
  }
}));