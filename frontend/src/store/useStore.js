import { create } from 'zustand';
import api from '../lib/api';

const useStore = create((set) => ({
  user:    JSON.parse(localStorage.getItem('propath_user') || 'null'),
  token:   localStorage.getItem('propath_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('propath_token', res.data.token);
      localStorage.setItem('propath_user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('propath_token', res.data.token);
      localStorage.setItem('propath_user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('propath_token');
    localStorage.removeItem('propath_user');
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      localStorage.setItem('propath_user', JSON.stringify(res.data));
      set({ user: res.data });
      return res.data;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    localStorage.setItem('propath_user', JSON.stringify(user));
    set({ user });
  }
}));

export default useStore;
