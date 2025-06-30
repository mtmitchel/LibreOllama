import React from 'react';
import { ChatMessage } from '../../../core/lib/chatMockData';
import { User, Bot, Copy } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.sender === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`flex gap-4 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser 
          ? 'bg-primary text-primary-foreground border border-primary/20' 
          : 'bg-muted text-foreground border border-border'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      {/* Message Content */}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Header */}
        <div className={`text-xs text-muted-foreground mb-3 ${isUser ? 'mr-1' : 'ml-1'}`}>
          <span className="font-semibold">
            {isUser ? 'You' : 'LibreOllama'}
          </span>
          <span className="mx-2">·</span>
          <span>{message.timestamp}</span>
        </div>
        
        {/* Message Bubble */}
        <div className={`relative group p-5 text-sm shadow-sm transition-all duration-200 hover:shadow-md ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-lg border border-primary/20'
            : 'bg-secondary text-secondary-foreground rounded-2xl rounded-bl-lg border border-border'
        }`}>
          {/* Enhanced readability with better line spacing and formatting */}
          <div className="leading-loose space-y-2">
            {message.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">
                {paragraph.split('\n').map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < paragraph.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
          
          {/* Copy Button */}
          <button
            onClick={handleCopyMessage}
            title="Copy message"
            className="absolute -top-2 -right-2 p-2 bg-background border border-border rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:bg-muted hover:scale-105"
          >
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
