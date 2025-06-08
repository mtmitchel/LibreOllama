import React, { useRef } from 'react';
import { Button, Textarea } from '../ui';
import { Paperclip, Send } from 'lucide-react';

interface ChatInputProps {
  newMessage: string;
  selectedChatId: string | null;
  selectedChatTitle?: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSendMessage(e as any);
    }
  };

  return (
    <footer className="px-6 py-5 border-t-2 border-border/30 flex-shrink-0 bg-background/80 backdrop-blur-sm">
      <form onSubmit={onSendMessage} className="flex items-end gap-3">
        {/* Attachment Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          type="button" 
          title="Attach files"
          className="p-3 hover:text-primary hover:scale-105 transition-all duration-200"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        
        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea 
            ref={textareaRef}
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onMessageChange(e.target.value)}
            placeholder={`Message ${selectedChatTitle || 'AI'}...`}
            className="w-full min-h-[52px] max-h-32 py-4 px-4 rounded-xl resize-none focus:ring-2 focus:ring-primary disabled:opacity-50 h-auto border-2 transition-all duration-200"
            onKeyDown={handleKeyDown}
            disabled={disabled || !selectedChatId}
            rows={1}
          />
        </div>
        
        {/* Send Button */}
        <Button
          type="submit"
          variant={newMessage.trim() && selectedChatId ? "primary" : "secondary"}
          size="icon"
          className={`p-3.5 transition-all duration-200 ${newMessage.trim() && selectedChatId ? "hover:scale-105 shadow-primary/25" : ""}`}
          disabled={!newMessage.trim() || !selectedChatId || disabled}
          title="Send message (⌘↵)"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </footer>
  );
}
