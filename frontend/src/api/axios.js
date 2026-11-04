import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://recordia-seven.vercel.app/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recordia_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
