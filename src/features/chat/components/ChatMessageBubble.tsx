import React from 'react';
import { ChatMessage } from '../../../core/lib/chatMockData';
import { Caption, Text, Button, Avatar, Card } from '../../../components/ui';
import { User, Bot, Copy, Edit3, CheckSquare } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  variant?: 'muted' | 'ghost' | 'outlined';
  onEdit?: (messageId: string) => void;
  onCreateTask?: (messageContent: string) => void;
}

export function ChatMessageBubble({ message, variant = 'ghost', onEdit, onCreateTask }: ChatMessageBubbleProps) {
  const isUser = message.sender === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleEditMessage = () => {
    if (onEdit && isUser) {
      onEdit(message.id);
    }
  };

  const handleCreateTask = () => {
    if (onCreateTask) {
      onCreateTask(message.content);
    }
  };

  // Get proper variant styles using standard design system patterns
  const getUserBubbleClasses = () => {
    switch (variant) {
      case 'muted':
        return 'bg-accent-primary text-white border-none';
      case 'ghost':
        return 'bg-accent-soft text-accent-primary border border-accent-primary';
      case 'outlined':
        return 'bg-secondary text-accent-primary border border-accent-primary';
      default:
        return 'bg-accent-soft text-accent-primary border border-accent-primary';
    }
  };

  const getBubbleClasses = () => {
    const baseRadius = 'rounded-xl';
    const userSpecific = isUser 
      ? `${baseRadius} rounded-br-md ${getUserBubbleClasses()}` 
      : `${baseRadius} rounded-bl-md`;
    return userSpecific;
  };

  return (
    <div className={`flex max-w-4xl gap-3 ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <Avatar 
        name={isUser ? 'User' : 'LibreOllama'}
        size="sm"
        fallbackIcon={isUser ? <User size={14} /> : <Bot size={14} />}
        className="mt-1 shrink-0 shadow-sm"
      />
      
      {/* Message Content */}
      <div className={`flex max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Header */}
        <Caption className={`mb-2 ${isUser ? 'mr-2' : 'ml-2'}`}>
          <Text as="span" weight="medium" size="xs" variant="secondary">
            {isUser ? 'You' : 'LibreOllama'}
          </Text>
          <span className="text-text-secondary mx-1">·</span>
          <span className="text-text-secondary">{message.timestamp}</span>
        </Caption>
        
        {/* Message Bubble using Card Component with proper elevation */}
        <Card 
          className={`group relative ${getBubbleClasses()}`}
          padding="default"
        >
          {/* Enhanced readability with proper line spacing and typography */}
          <Text 
            size="sm" 
            lineHeight="relaxed" 
            className="leading-relaxed"
            as="div"
            variant={isUser ? undefined : "body"}
          >
            {message.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className={`whitespace-pre-wrap ${index > 0 ? 'mt-3' : ''}`}>
                {paragraph.split('\n').map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < paragraph.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </Text>
          
          {/* Message Actions - Positioned top-right of the bubble */}
          <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
            {/* Copy Button - Always available */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyMessage}
              title="Copy message"
              className="border-border-primary size-auto rounded-lg border bg-content p-2 shadow-sm motion-safe:hover:scale-105"
            >
              <Copy className="text-text-secondary size-3" />
            </Button>

            {/* Edit Button - Only for user messages */}
            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditMessage}
                title="Edit message"
                className="border-border-primary size-auto rounded-lg border bg-content p-2 shadow-sm motion-safe:hover:scale-105"
              >
                <Edit3 className="text-text-secondary size-3" />
              </Button>
            )}

            {/* Create Task Button - Available for all messages */}
            {onCreateTask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreateTask}
                title="Create task from message"
                className="border-border-primary size-auto rounded-lg border bg-content p-2 shadow-sm motion-safe:hover:scale-105"
              >
                <CheckSquare className="text-text-secondary size-3" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
