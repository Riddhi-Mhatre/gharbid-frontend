import { useState, KeyboardEvent } from 'react';
import { sendMessage } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';
import { sendTyping } from '../../utils/socket';
import { Send, Lock } from 'lucide-react';
import { MessageSuggestions } from './MessageSuggestions';
import { FileAttachmentButton } from './FileAttachmentButton';

interface ChatInputProps {
  roomId: string;
  disabled?: boolean;
  disabledReason?: string;
  isAuctionRoom?: boolean;
}

export const ChatInput = ({ roomId, disabled, disabledReason, isAuctionRoom }: ChatInputProps) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { addMessage } = useChatStore();

  const handleSend = async () => {
    if (!content.trim() || sending || disabled) return;
    setSending(true);
    try {
      const msg = await sendMessage(roomId, content.trim());
      addMessage(roomId, msg);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (message: string) => {
    setContent(message);
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (input) input.focus();
  };

  if (disabled) {
    return (
      <div className="border-t border-dark-border p-4 flex items-center justify-center gap-3 bg-red-500/5">
        <Lock size={16} className="text-red-400 shrink-0" />
        <p className="text-sm text-red-400/80 font-medium">
          {disabledReason || 'Chat is no longer available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <MessageSuggestions onSelectSuggestion={handleSuggestionSelect} isAuctionRoom={isAuctionRoom} />
      <div className="border-t border-dark-border p-3 flex items-end gap-2 bg-dark-card/30">
        {/* File attachment button */}
        <FileAttachmentButton roomId={roomId} disabled={disabled} />

        <textarea
          id="chat-input"
          value={content}
          onChange={(e) => { setContent(e.target.value); sendTyping(roomId); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="input-field flex-1 resize-none max-h-32 text-sm md:text-base py-2.5"
          aria-label="Type a message"
        />
        <button
          id="chat-send-btn"
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="btn-primary p-2.5 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
