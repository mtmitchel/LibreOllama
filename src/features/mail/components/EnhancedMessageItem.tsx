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
  Mail, 
  MailOpen, 
  Archive, 
  Trash2, 
  Flag,
  Reply,
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
  const { 
    markAsRead, 
    markAsUnread, 
    starMessages, 
    unstarMessages, 
    archiveMessages, 
    deleteMessages,
    currentAccountId,
    currentMessage 
  } = useMailStore();

  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 }
  });
  
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Handle message click
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Don't trigger click if clicking on action buttons or checkbox
    if ((event.target as HTMLElement).closest('.action-button, .checkbox-button')) {
      return;
    }
    onClick(message);
  }, [message, onClick]);

  // Handle checkbox change
  const handleCheckboxChange = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(message.id, !isSelected);
  }, [message.id, isSelected, onSelect]);

  // Handle context menu
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY }
    });
  }, []);

  // Quick action handlers
  const executeQuickAction = useCallback(async (actionType: string, actionFn: () => Promise<void>) => {
    if (!currentAccountId || actionInProgress) return;
    
    setActionInProgress(actionType);
    try {
      await actionFn();
    } catch (error) {
      console.error(`Failed to ${actionType}:`, error);
    } finally {
      setActionInProgress(null);
    }
  }, [currentAccountId, actionInProgress]);

  const handleQuickStar = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (message.isStarred) {
      executeQuickAction('unstar', () => unstarMessages([message.id], currentAccountId));
    } else {
      executeQuickAction('star', () => starMessages([message.id], currentAccountId));
    }
  }, [message, executeQuickAction, starMessages, unstarMessages, currentAccountId]);

  const handleQuickArchive = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    executeQuickAction('archive', () => archiveMessages([message.id], currentAccountId));
  }, [message, executeQuickAction, archiveMessages, currentAccountId]);

  const handleQuickReadToggle = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (message.isRead) {
      executeQuickAction('mark_unread', () => markAsUnread([message.id], currentAccountId));
    } else {
      executeQuickAction('mark_read', () => markAsRead([message.id], currentAccountId));
    }
  }, [message, executeQuickAction, markAsRead, markAsUnread, currentAccountId]);

  // Format date
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else if (diffDays <= 365) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short' });
    }
  }, []);

  // Get sender display name
  const senderName = message.from.name || message.from.email;
  const senderDisplay = senderName.length > 20 ? `${senderName.substring(0, 20)}...` : senderName;

  // Get subject with fallback
  const subjectDisplay = message.subject || '(no subject)';
  const snippetDisplay = message.snippet || '';

  // Check if this message is currently selected/viewed
  const isCurrentMessage = currentMessage?.id === message.id;

  return (
    <>
      <div
        ref={itemRef}
        className={`relative flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)] transition-all duration-200 cursor-pointer ${
          isCurrentMessage 
            ? 'bg-[var(--accent-primary)]/10 border-l-4 border-l-[var(--accent-primary)]' 
            : isSelected
            ? 'bg-[var(--accent-primary)]/5'
            : isHovered
            ? 'bg-[var(--bg-secondary)]'
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
            className="checkbox-button flex items-center justify-center w-5 h-5 rounded border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] transition-colors"
            onClick={handleCheckboxChange}
            title={isSelected ? 'Deselect message' : 'Select message'}
          >
            {isSelected ? (
              <Check size={14} className="text-[var(--accent-primary)]" />
            ) : (
              <Square size={14} className="text-transparent" />
            )}
          </button>
        )}

        {/* Star Button */}
        <button
          className="action-button flex-shrink-0 p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
          onClick={handleQuickStar}
          disabled={actionInProgress === 'star' || actionInProgress === 'unstar'}
          title={message.isStarred ? 'Remove star' : 'Add star'}
        >
          {message.isStarred ? (
            <Star size={16} className="text-yellow-500 fill-current" />
          ) : (
            <StarOff size={16} className="text-[var(--text-tertiary)] hover:text-yellow-500" />
          )}
        </button>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* Sender */}
            <div className="flex items-center gap-2 min-w-0">
              <Text 
                size={compactMode ? "xs" : "sm"} 
                weight={message.isRead ? "normal" : "medium"}
                className={`truncate ${
                  message.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {senderDisplay}
              </Text>
              
              {/* Message indicators */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {message.hasAttachments && (
                  <Paperclip size={12} className="text-[var(--text-tertiary)]" />
                )}
                {message.importance === 'high' && (
                  <Flag size={12} className="text-red-500" />
                )}
              </div>
            </div>

            {/* Date */}
            <Text 
              size="xs" 
              variant="secondary"
              className="flex-shrink-0"
            >
              {formatDate(message.date)}
            </Text>
          </div>

          {/* Subject and Snippet */}
          <div className="space-y-1">
            <Text 
              size={compactMode ? "xs" : "sm"}
              weight={message.isRead ? "normal" : "medium"}
              className={`truncate ${
                message.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
              }`}
            >
              {subjectDisplay}
            </Text>
            
            {!compactMode && snippetDisplay && (
              <Text 
                size="xs" 
                variant="secondary"
                className="truncate"
              >
                {snippetDisplay}
              </Text>
            )}
          </div>
        </div>

        {/* Quick Actions (visible on hover) */}
        {(isHovered || isSelected) && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="action-button p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={handleQuickReadToggle}
              disabled={actionInProgress === 'mark_read' || actionInProgress === 'mark_unread'}
              title={message.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {message.isRead ? (
                <Mail size={14} className="text-[var(--text-secondary)]" />
              ) : (
                <MailOpen size={14} className="text-[var(--text-secondary)]" />
              )}
            </button>

            <button
              className="action-button p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
              onClick={handleQuickArchive}
              disabled={actionInProgress === 'archive'}
              title="Archive"
            >
              <Archive size={14} className="text-[var(--text-secondary)]" />
            </button>

            <button
              className="action-button p-1.5 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                // TODO: Add quick delete with confirmation
                console.log('Quick delete:', message.id);
              }}
              title="Delete"
            >
              <Trash2 size={14} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        )}

        {/* Unread indicator */}
        {!message.isRead && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-[var(--accent-primary)] rounded-r" />
        )}
      </div>

      {/* Context Menu */}
      <MessageContextMenu
        message={message}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onAction={(action, messageId) => {
          console.log(`Context action: ${action} on message ${messageId}`);
          // Handle context menu actions
        }}
      />
    </>
  );
}

export default EnhancedMessageItem; 