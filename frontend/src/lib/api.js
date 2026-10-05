import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('propath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    // Don't auto-redirect on auth endpoints — let the page handle the error
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('propath_token');
      localStorage.removeItem('propath_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
