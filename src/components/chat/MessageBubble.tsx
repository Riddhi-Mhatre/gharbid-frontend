import type { Message } from '../../types/chat.types';
import { formatRelativeTime } from '../../utils/formatters';
import { Check, CheckCheck, FileText, Download, ImageOff } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  // System/deal messages are handled by DealSystemCard — skip rendering here
  const SYSTEM_TYPES = ['deal_request', 'deal_response', 'meet_proposal', 'meet_confirmation', 'payment_buyer', 'payment_seller', 'deal_closed'];
  if (message.type && SYSTEM_TYPES.includes(message.type)) return null;

  const isFile = message.type === 'file';
  const payload = message.payload as any;
  const isImage = isFile && payload?.isImage;
  const fileUrl = isFile ? (payload?.url || message.content) : null;
  const fileName = isFile ? (payload?.fileName || 'attachment') : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div
        className={`max-w-[75%] rounded-2xl overflow-hidden ${
          isOwn
            ? 'bg-primary text-black rounded-br-sm'
            : 'bg-dark-hover border border-dark-border text-white rounded-bl-sm'
        }`}
      >
        {/* File message */}
        {isFile && (
          <div className={`${isOwn ? '' : ''}`}>
            {isImage ? (
              <div className="relative">
                <img
                  src={fileUrl!}
                  alt={fileName!}
                  className="max-w-xs max-h-64 object-cover rounded-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex-col items-center justify-center p-8 gap-2">
                  <ImageOff size={24} className="text-muted opacity-50" />
                  <span className="text-xs text-muted">Image unavailable</span>
                </div>
              </div>
            ) : (
              <a
                href={fileUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-3 ${
                  isOwn ? 'hover:bg-black/10' : 'hover:bg-white/5'
                } transition-colors`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isOwn ? 'bg-black/20' : 'bg-dark-border'}`}>
                  <FileText size={16} className={isOwn ? 'text-black/60' : 'text-muted'} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isOwn ? 'text-black' : 'text-white'}`}>{fileName}</p>
                  <p className={`text-xs ${isOwn ? 'text-black/50' : 'text-muted'}`}>PDF Document</p>
                </div>
                <Download size={14} className={`shrink-0 ${isOwn ? 'text-black/50' : 'text-muted'}`} />
              </a>
            )}
          </div>
        )}

        {/* Regular text message */}
        {!isFile && (
          <div className="px-3.5 py-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className={`flex items-center gap-1 px-3.5 pb-2 ${isOwn ? 'justify-end' : ''} ${isFile && !isImage ? '' : isFile ? 'pt-1.5 px-3' : ''}`}>
          <span className={`text-[10px] ${isOwn ? 'text-black/60' : 'text-muted'}`}>
            {formatRelativeTime(message.timestamp)}
          </span>
          {isOwn && (message.isRead
            ? <CheckCheck size={10} className="text-black/60" />
            : <Check size={10} className="text-black/40" />
          )}
        </div>
      </div>
    </div>
  );
};
