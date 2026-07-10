import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

export const useSilentRefresh = () => {
  const {refreshToken, setTokens, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return;

    // Refresh every 45 minutes (token expires in 60 mins)
    const REFRESH_INTERVAL = 45 * 60 * 1000;

    const refreshSession = async () => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken });
        const newTokens = response.data.data;
        if (newTokens?.IdToken) {
          setTokens(newTokens.IdToken, newTokens.RefreshToken);
        }
      } catch (err) {
        console.error('Silent token refresh failed', err);
      }
    };

    const intervalId = setInterval(refreshSession, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshToken, setTokens]);
};
