import axios from 'axios';

const api = axios.create({
  // Empty baseURL = use Vite proxy (requests go to localhost:5173 then proxy forwards to 4000)
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('expense_auth');
  if (auth) {
    const { token } = JSON.parse(auth);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;