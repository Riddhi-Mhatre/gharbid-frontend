import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { getRooms } from '../../services/chatService';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { DealSystemCard } from './DealSystemCard';
import { DealActionBar } from './DealActionBar';
import type { ChatRoom } from '../../types/chat.types';

interface ChatWindowProps {
  roomId: string;
}

export const ChatWindow = ({ roomId }: ChatWindowProps) => {
  const { messages, addMessage, rooms } = useChatStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Local mirror of room so deal state updates immediately after actions
  const storeRoom = (rooms as ChatRoom[]).find(r => r.roomId === roomId);
  const [room, setRoom] = useState<ChatRoom | undefined>(storeRoom);

  // Keep in sync when store updates (e.g. navigation between rooms)
  useEffect(() => {
    setRoom(storeRoom);
  }, [roomId, storeRoom?.dealStatus, storeRoom?.buyerPaid, storeRoom?.sellerPaid]);

  const roomMessages = messages[roomId] ?? [];
  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';
  const isAuctionRoom = room?.source === 'auction' || !!room?.auctionId;

  // Count only real user messages (not system ones) for the deal unlock threshold
  const SYSTEM_TYPES = ['deal_request', 'deal_response', 'meet_proposal', 'meet_confirmation', 'payment_buyer', 'payment_seller', 'deal_closed', 'file'];
  const realMessageCount = roomMessages.filter(m => !m.type || !SYSTEM_TYPES.includes(m.type)).length;

  // Auto-scroll on new messages (avoiding scrollIntoView to prevent page layout jumps)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [roomMessages]);

  // Socket: join room & listen for new messages
  useEffect(() => {
    let isActive = true;
    let cleanup: (() => void) | undefined;

    import('../../utils/socket').then(({ socket, joinChat, leaveChat }) => {
      if (!isActive || !socket) return;

      joinChat(roomId);

      const handleNewMessage = (msg: any) => {
        if (msg.roomId === roomId) {
          addMessage(roomId, msg);
          // If it's a deal state message, refresh rooms so room object updates
          if (msg.senderId === 'system') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
          }
        }
      };

      socket.on('new_message', handleNewMessage);

      cleanup = () => {
        socket.off('new_message', handleNewMessage);
        leaveChat(roomId);
      };
    });

    return () => {
      isActive = false;
      if (cleanup) cleanup();
    };
  }, [roomId, addMessage, queryClient]);

  /** Called by DealSystemCard to optimistically update local room state */
  const handleRoomUpdate = (updates: Partial<ChatRoom>) => {
    setRoom(prev => prev ? { ...prev, ...updates } : prev);
    // Also invalidate so it persists from server on next fetch
    queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    getRooms().then(fresh => {
      const freshRoom = (fresh as ChatRoom[]).find(r => r.roomId === roomId);
      if (freshRoom) setRoom(freshRoom);
    }).catch(() => {});
  };

  const isChatDisabled = room?.dealStatus === 'rejected';

  return (
    <div className="flex flex-col h-full" aria-label="Chat window">
      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-2 custom-scrollbar">
        {roomMessages.length === 0 && (
          <p className="text-muted text-xs text-center py-8">No messages yet. Say hello!</p>
        )}

        {roomMessages.map((msg) => {
          const DEAL_TYPES = ['deal_request', 'deal_response', 'meet_proposal', 'meet_confirmation', 'payment_buyer', 'payment_seller', 'deal_closed'];
          const isDealMessage = msg.type && DEAL_TYPES.includes(msg.type);

          if (isDealMessage && room) {
            return (
              <DealSystemCard
                key={msg.messageId}
                message={msg}
                room={room}
                isBuyer={isBuyer}
                isSeller={isSeller}
                onRoomUpdate={handleRoomUpdate}
              />
            );
          }

          return (
            <MessageBubble
              key={msg.messageId}
              message={msg}
              isOwn={msg.senderId === user?.userId}
            />
          );
        })}
      </div>

      {/* Deal Action Bar (buyer only, before any deal) */}
      {isBuyer && room && !isChatDisabled && (
        <DealActionBar
          roomId={roomId}
          messageCount={realMessageCount}
          dealStatus={room.dealStatus}
          isBuyer={isBuyer}
        />
      )}

      {/* Chat Input */}
      <ChatInput
        roomId={roomId}
        disabled={isChatDisabled}
        disabledReason="This deal was declined. Chat is now closed."
        isAuctionRoom={isAuctionRoom}
      />
    </div>
  );
};
