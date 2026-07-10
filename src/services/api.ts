import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    
    if (err.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken });
          const newTokens = response.data.data;
          
          if (newTokens?.IdToken) {
             setTokens(newTokens.IdToken, newTokens.RefreshToken);
             processQueue(null, newTokens.IdToken);
             originalRequest.headers.Authorization = `Bearer ${newTokens.IdToken}`;
             return api(originalRequest);
          } else {
             throw new Error('No IdToken returned');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          logout();
        } finally {
          isRefreshing = false;
        }
      } else {
        processQueue(new Error('No refresh token'), null);
        logout();
        isRefreshing = false;
      }
    } else if (err.response?.status === 401) {
      // Only log out if it's explicitly an auth failure that cannot be retried
      // Avoid logging out on random 401s if a refresh could still be attempted later
      const authStore = useAuthStore.getState();
      if (!authStore.refreshToken) {
         authStore.logout();
      }
    }
    return Promise.reject(err);
  }
);
