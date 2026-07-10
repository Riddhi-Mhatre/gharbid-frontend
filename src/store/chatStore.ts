import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatRoom, Message } from '../types/chat.types';

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  hasUnreadAlerts: boolean;
  setRooms: (rooms: ChatRoom[]) => void;
  setActiveRoom: (roomId: string | null) => void;
  addMessage: (roomId: string, message: Message) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  markRoomRead: (roomId: string) => void;
  setHasUnreadAlerts: (val: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      rooms: [],
      activeRoomId: null,
      messages: {},
      unreadCounts: {},
      hasUnreadAlerts: false,

      setRooms: (rooms) => set({ rooms }),
      setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
      setHasUnreadAlerts: (val) => set({ hasUnreadAlerts: val }),

      addMessage: (roomId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: [...(state.messages[roomId] ?? []), message],
          },
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: roomId !== state.activeRoomId
              ? (state.unreadCounts[roomId] ?? 0) + 1
              : 0,
          },
        })),

      setMessages: (roomId, messages) =>
        set((state) => ({ messages: { ...state.messages, [roomId]: messages } })),

      markRoomRead: (roomId) =>
        set((state) => ({ unreadCounts: { ...state.unreadCounts, [roomId]: 0 } })),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        hasUnreadAlerts: state.hasUnreadAlerts,
        unreadCounts: state.unreadCounts,
      }),
    }
  )
);
