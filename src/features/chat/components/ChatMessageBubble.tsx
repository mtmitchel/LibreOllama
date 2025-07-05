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

  const getUserMessageStyles = () => {
    // User messages use ghost variant as preferred - subtle background tint with colored text
    switch (variant) {
      case 'muted':
        return 'bg-[var(--accent-muted)] text-white border-none';
      case 'ghost':
        // Ghost style: subtle background tint with colored text (preferred)
        return 'bg-[var(--accent-ghost)] text-[var(--accent-primary)] border border-[var(--accent-soft)]';
      case 'outlined':
        return 'bg-[var(--bg-surface)] text-[var(--accent-primary)] border border-[var(--accent-primary)]';
      default:
        return 'bg-[var(--accent-ghost)] text-[var(--accent-primary)] border border-[var(--accent-soft)]';
    }
  };

  const getBubbleRadius = () => {
    const baseRadius = 'rounded-[var(--radius-xl)]';
    return isUser 
      ? `${baseRadius} rounded-br-[var(--radius-md)]` 
      : `${baseRadius} rounded-bl-[var(--radius-md)]`;
  };

  return (
    <div className={`flex max-w-4xl gap-[var(--space-3)] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <Avatar 
        name={isUser ? 'User' : 'LibreOllama'}
        size="sm"
        fallbackIcon={isUser ? <User size={14} /> : <Bot size={14} />}
        className="shadow-sm flex-shrink-0 mt-[var(--space-1)]"
      />
      
      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Header */}
        <Caption className={`mb-[var(--space-2)] ${isUser ? 'mr-[var(--space-2)]' : 'ml-[var(--space-2)]'}`}>
          <Text as="span" weight="medium" size="xs" variant="secondary">
            {isUser ? 'You' : 'LibreOllama'}
          </Text>
          <span className="mx-[var(--space-1)] text-[var(--text-secondary)]">·</span>
          <span className="text-[var(--text-secondary)]">{message.timestamp}</span>
        </Caption>
        
        {/* Message Bubble using Card Component with proper elevation */}
        <Card 
          className={`relative group ${getBubbleRadius()} ${!isUser ? '' : getUserMessageStyles()}`}
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
              <p key={index} className={`whitespace-pre-wrap ${index > 0 ? 'mt-[var(--space-3)]' : ''}`}>
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
          <div className={`absolute opacity-0 group-hover:opacity-100 transition-all duration-200 top-[-0.5rem] flex gap-[var(--space-1)] ${isUser ? 'right-[-0.5rem]' : 'right-[-0.5rem]'}`}>
            {/* Copy Button - Always available */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyMessage}
              title="Copy message"
              className="shadow-[var(--shadow-button)] hover:scale-105 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--space-2)] w-auto h-auto"
            >
              <Copy className="text-[var(--text-muted)] w-[var(--space-3)] h-[var(--space-3)]" />
            </Button>

            {/* Edit Button - Only for user messages */}
            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEditMessage}
                title="Edit message"
                className="shadow-[var(--shadow-button)] hover:scale-105 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--space-2)] w-auto h-auto"
              >
                <Edit3 className="text-[var(--text-muted)] w-[var(--space-3)] h-[var(--space-3)]" />
              </Button>
            )}

            {/* Create Task Button - Available for all messages */}
            {onCreateTask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreateTask}
                title="Create task from message"
                className="shadow-[var(--shadow-button)] hover:scale-105 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--space-2)] w-auto h-auto"
              >
                <CheckSquare className="text-[var(--text-muted)] w-[var(--space-3)] h-[var(--space-3)]" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
