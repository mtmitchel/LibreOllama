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
import { safeDecodeHtmlEntities } from '../utils/htmlDecode';

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

  // Format date relative to now (Gmail style)
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      // Today: show time in 12-hour format
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else if (days < 7) {
      // This week: show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else if (date.getFullYear() === now.getFullYear()) {
      // This year: show month and day
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      // Older: show full date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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

  // Get subject with fallback and decode HTML entities
  const subjectDisplay = safeDecodeHtmlEntities(message.subject || '(no subject)');
  const snippetDisplay = safeDecodeHtmlEntities(message.snippet || '');

  // Check if this message is currently selected/viewed
  const isCurrentMessage = currentMessage?.id === message.id;

  return (
    <>
      <div
        ref={itemRef}
        className={`border-border-default relative flex cursor-pointer items-center gap-2 border-b px-3 py-2 motion-safe:transition-all motion-safe:duration-200 ${
          isCurrentMessage 
            ? 'bg-[var(--accent-primary)]/10' 
            : isSelected
            ? 'bg-[var(--accent-primary)]/5'
            : isHovered
            ? 'bg-[var(--bg-secondary)]'
            : 'bg-[var(--bg-primary)]'
        } ${isCurrentMessage ? 'shadow-[inset_3px_0_0_0_var(--accent-primary)]' : ''} ${className}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection Checkbox */}
        {showCheckbox ? (
          <div className="shrink-0 flex items-center justify-center">
            <button
              className="checkbox-button inline-flex size-4 items-center justify-center rounded-[3px] border border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-focus)] shadow-none motion-safe:transition-colors motion-safe:duration-150 box-border p-0"
              onClick={handleCheckboxChange}
              title={isSelected ? 'Deselect message' : 'Select message'}
            >
              {isSelected ? (
                <Check size={12} className="text-[var(--accent-primary)]" />
              ) : (
                <Square size={12} className="text-transparent" />
              )}
            </button>
          </div>
        ) : (
          <div className="w-6" />
        )}

        {/* Star Button */}
        <div className="shrink-0 flex items-center justify-center">
          <button
            className="action-button rounded p-1 hover:bg-[var(--bg-tertiary)] motion-safe:transition-colors motion-safe:duration-150"
            onClick={handleQuickStar}
            disabled={actionInProgress === 'star' || actionInProgress === 'unstar'}
            title={message.isStarred ? 'Remove star' : 'Add star'}
          >
            {message.isStarred ? (
              <Star size={16} className="fill-[var(--warning)] text-[var(--warning)]" />
            ) : (
              <StarOff size={16} className="text-[var(--text-tertiary)] hover:text-[var(--warning)] motion-safe:transition-colors motion-safe:duration-150" />
            )}
          </button>
        </div>

        {/* Message Content - single line with proper truncation */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {/* Sender */}
          <span 
            className={`shrink-0 text-sm w-44 truncate ${
              message.isRead ? 'font-normal text-[var(--text-secondary)]' : 'font-semibold text-[var(--text-primary)]'
            }`}
          >
            {truncatedSender}
          </span>
          
          {/* Subject and snippet on same line */}
          <div className="min-w-0 flex-1 flex items-center">
            <span 
              className={`text-sm truncate ${
                message.isRead ? 'font-normal text-[var(--text-secondary)]' : 'font-semibold text-[var(--text-primary)]'
              }`}
            >
              {subjectDisplay}
            </span>
            {snippetDisplay && (
              <>
                <span className="mx-1 text-sm text-[var(--text-tertiary)]">-</span>
                <span className="text-sm text-[var(--text-tertiary)] truncate">
                  {snippetDisplay}
                </span>
              </>
            )}
          </div>
          
          {/* Indicators */}
          <div className="shrink-0 flex items-center gap-1">
            {message.hasAttachments && (
              <Paperclip size={14} className="text-[var(--text-tertiary)]" />
            )}
            {message.importance === 'high' && (
              <Flag size={14} className="text-[var(--semantic-error)]" />
            )}
          </div>
        </div>

        {/* Date and Quick Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Quick Actions - shown on hover */}
          {(isHovered || isSelected) && (
            <div className="flex items-center gap-1">
              <button
                className="action-button rounded p-1 hover:bg-[var(--bg-tertiary)] motion-safe:transition-colors motion-safe:duration-150"
                onClick={handleQuickArchive}
                disabled={actionInProgress === 'archive'}
                title="Archive"
              >
                <Archive size={14} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] motion-safe:transition-colors motion-safe:duration-150" />
              </button>
              
              <button
                className="action-button rounded p-1 hover:bg-[var(--bg-tertiary)] motion-safe:transition-colors motion-safe:duration-150"
                onClick={handleQuickDelete}
                disabled={actionInProgress === 'delete'}
                title="Delete"
              >
                <Trash2 size={14} className="text-[var(--text-secondary)] hover:text-[var(--semantic-error)] motion-safe:transition-colors motion-safe:duration-150" />
              </button>
            </div>
          )}
          
          {/* Date - always visible */}
          <span 
            className={`text-xs whitespace-nowrap ${
              message.isRead ? 'text-[var(--text-tertiary)]' : 'font-semibold text-[var(--text-primary)]'
            }`}
          >
            {formatDate(message.date)}
          </span>
        </div>

      </div>

      {/* Context Menu */}
      {contextMenuPosition && (
        <MessageContextMenu
          message={message}
          isOpen={true}
          position={contextMenuPosition}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  );
}

export default EnhancedMessageItem; 
