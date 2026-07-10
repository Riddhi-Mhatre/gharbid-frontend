import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '../utils/socket';
import { useAuthStore } from '../store/authStore';
import type { Socket } from 'socket.io-client';

export const useSocket = (): Socket | null => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      initSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return isAuthenticated ? initSocket() : null;
};
