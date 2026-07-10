import { useState } from 'react';
import { Handshake, Loader2, Lock } from 'lucide-react';
import { sendDealRequest } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';
import type { DealStatus } from '../../types/chat.types';

interface DealActionBarProps {
  roomId: string;
  messageCount: number;
  dealStatus?: DealStatus;
  isBuyer: boolean;
}

const MIN_MESSAGES_BEFORE_DEAL = 3;

export const DealActionBar = ({ roomId, messageCount, dealStatus, isBuyer }: DealActionBarProps) => {
  const [loading, setLoading] = useState(false);
  const { addMessage } = useChatStore();

  if (!isBuyer) return null;
  if (dealStatus && dealStatus !== undefined) return null; // Already in deal flow

  const canRequest = messageCount >= MIN_MESSAGES_BEFORE_DEAL;

  const handleDealRequest = async () => {
    if (!canRequest || loading) return;
    setLoading(true);
    try {
      const msg = await sendDealRequest(roomId);
      addMessage(roomId, msg);
    } catch {
      alert('Failed to send deal request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-dark-border px-4 py-3 flex items-center justify-between bg-black/20">
      <p className="text-xs text-muted">
        {canRequest
          ? 'Ready to move forward with this property?'
          : `Chat a bit more before closing (${messageCount}/${MIN_MESSAGES_BEFORE_DEAL} messages)`}
      </p>
      <button
        onClick={handleDealRequest}
        disabled={!canRequest || loading}
        title={canRequest ? 'Request to close the deal' : `Need ${MIN_MESSAGES_BEFORE_DEAL - messageCount} more messages`}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
          canRequest
            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-lg hover:shadow-emerald-500/20'
            : 'bg-dark-hover border border-dark-border text-muted cursor-not-allowed'
        }`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : canRequest ? (
          <Handshake size={14} />
        ) : (
          <Lock size={14} />
        )}
        Close the Deal
      </button>
    </div>
  );
};
