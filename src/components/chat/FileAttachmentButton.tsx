import { useRef, useState } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { uploadChatFile, sendMessage } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';

interface FileAttachmentButtonProps {
  roomId: string;
  disabled?: boolean;
}

export const FileAttachmentButton = ({ roomId, disabled }: FileAttachmentButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMessage } = useChatStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadChatFile(file);
      const isImage = file.type.startsWith('image/');
      const content = publicUrl;
      const msg = await sendMessage(roomId, content, 'file', {
        fileName: file.name,
        fileType: file.type,
        isImage,
        url: publicUrl,
      });
      addMessage(roomId, msg);
    } catch {
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Attach image or PDF"
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-secondary" />
        ) : (
          <Paperclip size={16} />
        )}
      </button>
    </>
  );
};
