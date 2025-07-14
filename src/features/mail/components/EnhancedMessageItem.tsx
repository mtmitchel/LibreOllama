/**
 * Enhanced Message Item - Phase 2.2
 * 
 * Advanced message list item with selection, context menu, visual states,
 * and quick action buttons for comprehensive email management.
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Star, 
  StarOff, 
  Paperclip, 
  Archive, 
  Trash2, 
  Flag,
  Check,
  Square
} from 'lucide-react';
import { ParsedEmail } from '../types';
import { useMailStore } from '../stores/mailStore';
import { MessageContextMenu } from './MessageContextMenu';
import { Text } from '../../../components/ui';

interface EnhancedMessageItemProps {
  message: ParsedEmail;
  isSelected: boolean;
  onSelect: (messageId: string, isSelected: boolean) => void;
  onClick: (message: ParsedEmail) => void;
  showCheckbox?: boolean;
  compactMode?: boolean;
  className?: string;
}

export function EnhancedMessageItem({
  message,
  isSelected,
  onSelect,
  onClick,
  showCheckbox = true,
  compactMode = false,
  className = ''
}: EnhancedMessageItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const { 
    currentMessage,
    starMessages, 
    unstarMessages,
    archiveMessages,
    deleteMessages
  } = useMailStore();

  // Format date relative to now
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
    }
  };

  // Quick actions with optimistic updates
  const handleQuickStar = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const action = message.isStarred ? 'unstar' : 'star';
    setActionInProgress(action);

    try {
      if (message.isStarred) {
        await unstarMessages([message.id]);
      } else {
        await starMessages([message.id]);
      }
    } catch (error) {
      console.error(`Failed to ${action} message:`, error);
    } finally {
      setActionInProgress(null);
    }
  }, [message.id, message.isStarred, starMessages, unstarMessages]);

  const handleQuickArchive = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setActionInProgress('archive');
    try {
      await archiveMessages([message.id]);
    } catch (error) {
      console.error('Failed to archive message:', error);
    } finally {
      setActionInProgress(null);
    }
  }, [message.id, archiveMessages]);

  const handleQuickDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setActionInProgress('delete');
    try {
      await deleteMessages([message.id]);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setActionInProgress(null);
    }
  }, [message.id, deleteMessages]);

  // Event handlers
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger on action button clicks
    if ((e.target as Element).closest('.action-button')) return;
    if ((e.target as Element).closest('.checkbox-button')) return;
    
    onClick(message);
  }, [onClick, message]);

  const handleCheckboxChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(message.id, !isSelected);
  }, [onSelect, message.id, isSelected]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuPosition(null);
  }, []);

  // Display formatting
  const senderDisplay = message.from.name || message.from.email;
  
  // Truncate sender for compact mode
  const truncatedSender = compactMode && senderDisplay.length > 20 
    ? senderDisplay.substring(0, 20) + '...' 
    : senderDisplay;

  // Get subject with fallback
  const subjectDisplay = message.subject || '(no subject)';
  const snippetDisplay = message.snippet || '';

  // Check if this message is currently selected/viewed
  const isCurrentMessage = currentMessage?.id === message.id;

  return (
    <>
      <div
        ref={itemRef}
        className={`border-border-default relative flex cursor-pointer items-center gap-3 border-b px-4 py-3 motion-safe:transition-all motion-safe:duration-200 ${
          isCurrentMessage 
            ? 'bg-accent-primary/10 border-l-4 border-l-accent-primary' 
            : isSelected
            ? 'bg-accent-primary/5'
            : isHovered
            ? 'bg-secondary'
            : 'bg-transparent'
        } ${!message.isRead ? 'font-medium' : ''} ${className}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection Checkbox */}
        {showCheckbox && (
          <button
            className="checkbox-button border-border-default flex size-5 items-center justify-center rounded border hover:bg-tertiary motion-safe:transition-colors motion-safe:duration-150"
            onClick={handleCheckboxChange}
            title={isSelected ? 'Deselect message' : 'Select message'}
          >
            {isSelected ? (
              <Check size={14} className="text-accent-primary" />
            ) : (
              <Square size={14} className="text-transparent" />
            )}
          </button>
        )}

        {/* Star Button */}
        <button
          className="action-button shrink-0 rounded p-1 hover:bg-tertiary motion-safe:transition-colors motion-safe:duration-150"
          onClick={handleQuickStar}
          disabled={actionInProgress === 'star' || actionInProgress === 'unstar'}
          title={message.isStarred ? 'Remove star' : 'Add star'}
        >
          {message.isStarred ? (
            <Star size={16} className="fill-current text-warning" />
          ) : (
            <StarOff size={16} className="text-tertiary hover:text-warning motion-safe:transition-colors motion-safe:duration-150" />
          )}
        </button>

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            {/* Sender */}
            <div className="flex min-w-0 items-center gap-2">
              <Text 
                size={compactMode ? "xs" : "sm"} 
                weight={message.isRead ? "normal" : "medium"}
                className={`truncate ${
                  message.isRead ? 'text-secondary' : 'text-primary'
                }`}
              >
                {truncatedSender}
              </Text>
              
              {/* Message indicators */}
              <div className="flex shrink-0 items-center gap-1">
                {message.hasAttachments && (
                  <Paperclip size={12} className="text-tertiary" />
                )}
                {message.importance === 'high' && (
                  <Flag size={12} className="text-error" />
                )}
              </div>
            </div>

            {/* Date */}
            <Text 
              size="xs" 
              variant="secondary"
              className="shrink-0"
            >
              {formatDate(message.date)}
            </Text>
          </div>

          {/* Subject and Snippet */}
          <div className="flex min-w-0 flex-col">
            <Text 
              size={compactMode ? "xs" : "sm"}
              weight={message.isRead ? "normal" : "medium"}
              className={`truncate leading-tight ${
                message.isRead ? 'text-secondary' : 'text-primary'
              }`}
            >
              {subjectDisplay}
            </Text>
            
            {!compactMode && snippetDisplay && (
              <Text 
                size="xs" 
                variant="tertiary"
                className="mt-0.5 truncate leading-tight"
              >
                {snippetDisplay}
              </Text>
            )}
          </div>
        </div>

        {/* Quick Actions - shown on hover */}
        {(isHovered || isSelected) && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="action-button rounded p-1 hover:bg-tertiary motion-safe:transition-colors motion-safe:duration-150"
              onClick={handleQuickArchive}
              disabled={actionInProgress === 'archive'}
              title="Archive"
            >
              <Archive size={14} className="text-secondary hover:text-primary motion-safe:transition-colors motion-safe:duration-150" />
            </button>
            
            <button
              className="action-button rounded p-1 hover:bg-tertiary motion-safe:transition-colors motion-safe:duration-150"
              onClick={handleQuickDelete}
              disabled={actionInProgress === 'delete'}
              title="Delete"
            >
              <Trash2 size={14} className="text-secondary hover:text-error motion-safe:transition-colors motion-safe:duration-150" />
            </button>
          </div>
        )}

        {/* Read/Unread Indicator */}
        {!message.isRead && (
          <div className="shrink-0">
            <div className="size-2 rounded-full bg-accent-primary"></div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenuPosition && (
        <MessageContextMenu
          message={message}
          position={contextMenuPosition}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  );
}

export default EnhancedMessageItem; 