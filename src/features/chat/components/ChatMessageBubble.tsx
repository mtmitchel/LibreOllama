import React from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Avatar } from '../../../components/ui/design-system/Avatar';
import { Text, Caption } from '../../../components/ui';
import { ChatMessage } from '../../../core/lib/chatMockData';
import { formatTimestamp } from '../utils/formatTimestamp';
import { User, Bot, Copy, Edit3, CheckSquare, RotateCcw } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  variant?: 'default' | 'ghost' | 'muted' | 'outlined';
  onEdit?: (messageId: string) => void;
  onCreateTask?: (messageContent: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export function ChatMessageBubble({ message, variant = 'ghost', onEdit, onCreateTask, onRegenerate }: ChatMessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  // Debug: remove in production
  // console.log('ChatMessageBubble', {
  //   messageId: message.id,
  //   sender: message.sender,
  //   isUser,
  //   hasOnRegenerate: !!onRegenerate
  // });

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

  const handleRegenerate = () => {
    if (onRegenerate && !isUser) {
      onRegenerate(message.id);
    }
  };

  // Get proper variant styles using standard design system patterns
  const getUserBubbleClasses = () => {
    switch (variant) {
      case 'muted':
        return 'bg-accent-primary text-white border-none';
      case 'ghost':
        // Ghost style uses subtle tint with colored text
        return 'bg-accent-soft text-accent-primary border border-accent-primary/30';
      case 'outlined':
        return 'bg-secondary text-accent-primary border border-accent-primary/40';
      default:
        return 'bg-accent-soft text-accent-primary border border-accent-primary/30';
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
        fallback={isUser ? <User size={14} /> : <Bot size={14} />}
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
          <span className="text-text-secondary">{formatTimestamp(message.timestamp)}</span>
        </Caption>
        
        {/* Message Bubble and Actions Container */}
        <div className="group">
          {/* Message Bubble using Card Component with proper elevation */}
          <Card 
            className={`relative ${getBubbleClasses()}`}
            padding="md"
          >
          {/* Enhanced readability with proper line spacing and typography */}
          <Text 
            size="base" 
            lineHeight="relaxed" 
            className="leading-relaxed asana-text-base"
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
          

        </Card>
        
        {/* Message Actions - Positioned at the bottom of the message */}
        <div className={`mt-2 flex gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {/* Copy Button - Always available */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyMessage}
            title="Copy message"
            className="size-auto rounded-lg bg-content p-2 shadow-sm motion-safe:hover:scale-105"
          >
            <Copy className="text-text-secondary size-3" />
          </Button>

          {/* Regenerate Button - Only for AI messages */}
          {!isUser && onRegenerate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerate}
              title="Regenerate response"
              className="size-auto rounded-lg bg-content p-2 shadow-sm motion-safe:hover:scale-105"
            >
              <RotateCcw className="text-text-secondary size-3" />
            </Button>
          )}

          {/* Edit Button - Only for user messages */}
          {isUser && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditMessage}
              title="Edit message"
              className="size-auto rounded-lg bg-content p-2 shadow-sm motion-safe:hover:scale-105"
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
              className="size-auto rounded-lg bg-content p-2 shadow-sm motion-safe:hover:scale-105"
            >
              <CheckSquare className="text-text-secondary size-3" />
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
