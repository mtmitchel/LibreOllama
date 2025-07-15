import React, { useRef } from 'react';
import { Button, Input } from '../../../components/ui';
import { Paperclip, Send } from 'lucide-react';
import { useChatAttachments } from '../hooks/useChatAttachments';
import { ChatAttachmentPreview } from './ChatAttachmentPreview';

interface ChatInputProps {
  newMessage: string;
  selectedChatId: string | null;
  selectedChatTitle?: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent, attachments?: any[]) => void;
  disabled?: boolean;
}

export function ChatInput({
  newMessage,
  selectedChatId,
  selectedChatTitle,
  onMessageChange,
  onSendMessage,
  disabled = false
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    attachments, 
    isUploading, 
    removeAttachment, 
    clearAttachments, 
    handleFileSelect 
  } = useChatAttachments();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as React.FormEvent);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    const completedAttachments = attachments.filter(att => att.uploadStatus === 'completed');
    onSendMessage(e, completedAttachments);
    
    // Clear attachments after sending
    if (completedAttachments.length > 0) {
      clearAttachments();
    }
  };

  const hasContent = newMessage?.trim() || attachments.some(att => att.uploadStatus === 'completed');
  const canSend = hasContent && selectedChatId && !disabled && !isUploading;

  return (
    <footer className="bg-surface/80 shrink-0 backdrop-blur-sm">
      {/* Attachment Preview */}
      <ChatAttachmentPreview 
        attachments={attachments}
        onRemove={removeAttachment}
      />
      
      {/* Input Container */}
      <div className="flex items-center gap-3 p-4">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Left: Attachment IconButton */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleAttachmentClick}
          disabled={!selectedChatId || disabled}
          className="text-secondary hover:text-primary disabled:opacity-50"
          title="Attach file"
        >
          <Paperclip size={16} />
        </Button>

        {/* Center: Input Field */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Ask anything..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedChatId || disabled}
            className="border-border-default bg-surface"
          />
        </div>

        {/* Right: Send Button */}
        <Button
          type="button"
          onClick={handleSendMessage}
          variant={canSend ? "primary" : "secondary"}
          size="icon"
          disabled={!canSend}
          title="Send message (Enter)"
          className="shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </footer>
  );
}
