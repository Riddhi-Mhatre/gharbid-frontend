import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket;

export const initSocket = (): Socket => {
  if (!socket) {
    const token = useAuthStore.getState().token;
    socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.warn('Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined as any;
  }
};

export { socket };

// Re-export typed emit helpers
export const joinAuction = (auctionId: string) => socket.emit('join_auction', auctionId);
export const leaveAuction = (auctionId: string) => socket.emit('leave_auction', auctionId);
export const joinChat = (roomId: string) => socket.emit('join_chat', roomId);
export const leaveChat = (roomId: string) => socket.emit('leave_chat', roomId);
export const sendTyping = (roomId: string) => socket.emit('typing', { roomId });
