import React, { useState, useMemo, useCallback } from 'react';
import { useMailStore } from '../stores/mailStore';
import { ParsedEmail, EmailAddress, GmailAccount } from '../types';
import { handleGmailError } from '../services/gmailErrorHandler';
import { ErrorDisplay } from './ErrorDisplay';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

interface UnifiedInboxProps {
  className?: string;
}

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ className = '' }) => {
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'sender' | 'subject'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const {
    getAccountsArray,
    accountData,
    settings,
    isLoadingMessages,
    error,
    fetchMessages,
    markAsRead,
    markAsUnread,
    starMessages,
    unstarMessages,
    selectMessage,
    selectedMessages,
    clearError,
  } = useMailStore();

  const accounts = getAccountsArray();

  // Get all messages from all accounts
  const allMessages = useMemo(() => {
    const messages: ParsedEmail[] = [];
    
    Object.values(accountData).forEach(data => {
      messages.push(...data.messages);
    });

    return messages;
  }, [accountData]);

  // Filter and sort messages
  const filteredAndSortedMessages = useMemo(() => {
    let filtered = allMessages;

    // Filter by account if selected
    if (selectedAccountFilter) {
      filtered = filtered.filter(msg => msg.accountId === selectedAccountFilter);
    }

    // Filter by read status
    if (showOnlyUnread) {
      filtered = filtered.filter(msg => !msg.isRead);
    }

    // Sort messages
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'sender':
          comparison = a.from.email.localeCompare(b.from.email);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allMessages, selectedAccountFilter, showOnlyUnread, sortBy, sortOrder]);

  // Get account by ID
  const getAccountById = (accountId: string): GmailAccount | undefined => {
    return accounts.find(acc => acc.id === accountId);
  };

  // Get account color for visual distinction
  const getAccountColor = (accountId: string): string => {
    const index = accounts.findIndex(acc => acc.id === accountId);
    const colors = [
      'bg-accent-primary',
      'bg-success',
      'bg-warning',
      'bg-error',
      'bg-accent-secondary',
      'bg-accent-primary',
      'bg-warning',
      'bg-success',
    ];
    return colors[index % colors.length];
  };

  const handleMessageClick = (message: ParsedEmail) => {
    // Mark as read if unread
    if (!message.isRead) {
      markAsRead([message.id], message.accountId);
    }
  };

  const handleStarToggle = (message: ParsedEmail, e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.isStarred) {
      unstarMessages([message.id], message.accountId);
    } else {
      starMessages([message.id], message.accountId);
    }
  };

  const handleReadToggle = (message: ParsedEmail, e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.isRead) {
      markAsUnread([message.id], message.accountId);
    } else {
      markAsRead([message.id], message.accountId);
    }
  };

  const handleSelectMessage = (message: ParsedEmail, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const isSelected = selectedMessages.includes(message.id);
    selectMessage(message.id, !isSelected);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!settings.enableUnifiedInbox) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <div className="text-center">
          <h3 className="mb-2 asana-text-lg font-medium text-primary">
            Unified Inbox Disabled
          </h3>
          <p className="mb-4 asana-text-sm text-secondary dark:text-muted">
            Enable unified inbox in settings to view emails from all accounts in one place.
          </p>
          <button
            onClick={() => useMailStore.getState().updateSettings({ enableUnifiedInbox: true })}
            className="rounded-lg bg-accent-primary px-4 py-2 asana-text-sm font-medium text-white transition-colors hover:bg-accent-secondary"
          >
            Enable Unified Inbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b p-4 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="asana-text-lg font-semibold text-primary">
            Unified Inbox
          </h2>
          <span className="asana-text-sm text-secondary dark:text-muted">
            {filteredAndSortedMessages.length} message{filteredAndSortedMessages.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Account Filter */}
          <select
            value={selectedAccountFilter || ''}
            onChange={(e) => setSelectedAccountFilter(e.target.value || null)}
            className="border-border-default focus:ring-accent-primary rounded-lg border bg-white px-3 py-1 asana-text-sm text-primary focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-surface dark:text-gray-100"
          >
            <option value="">All accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.displayName} ({account.email})
              </option>
            ))}
          </select>

          {/* Show Only Unread */}
          <label className="flex items-center space-x-2 asana-text-sm text-primary dark:text-muted">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => setShowOnlyUnread(e.target.checked)}
              className="border-border-default focus:ring-accent-primary rounded bg-white text-accent-primary dark:border-gray-600 dark:bg-surface"
            />
            <span>Unread only</span>
          </label>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'sender' | 'subject')}
              className="border-border-default focus:ring-accent-primary rounded-lg border bg-white px-3 py-1 asana-text-sm text-primary focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-surface dark:text-gray-100"
            >
                          <option value="date">Sort by date</option>
            <option value="sender">Sort by sender</option>
            <option value="subject">Sort by subject</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-muted transition-colors hover:text-secondary dark:text-secondary dark:hover:text-muted"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <svg className={`size-4${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={handleGmailError(error, { operation: 'unified_inbox' })}
          onRetry={() => clearError()}
        />
      )}

      {/* Loading State */}
      {isLoadingMessages && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-3">
            <div className="size-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent"></div>
            <span className="asana-text-sm text-secondary dark:text-muted">Loading messages...</span>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedMessages.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto mb-4 size-12 text-muted dark:text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8v.01M6 5v.01" />
              </svg>
              <h3 className="mb-2 asana-text-lg font-medium text-primary">
                No messages found
              </h3>
              <p className="asana-text-sm text-secondary dark:text-muted">
                {showOnlyUnread ? 'No unread messages' : 'Your unified inbox is empty'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedMessages.map(message => {
              const account = getAccountById(message.accountId);
              const isSelected = selectedMessages.includes(message.id);
              
              return (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`flex cursor-pointer items-center space-x-4 p-4 transition-colors hover:bg-surface dark:hover:bg-gray-700 ${
                    isSelected ? 'bg-accent-soft' : ''
                  } ${!message.isRead ? 'bg-accent-soft' : ''}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectMessage(message, e)}
                    className="border-border-default focus:ring-accent-primary rounded bg-white text-accent-primary dark:border-gray-600 dark:bg-surface"
                  />

                  {/* Account Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className={`size-3 rounded-full ${getAccountColor(message.accountId)}`} title={account?.email}></div>
                    <span className="hidden text-[11px] text-secondary dark:text-muted sm:inline">
                      {account?.displayName?.substring(0, 10)}
                    </span>
                  </div>

                  {/* Star */}
                  <button
                    onClick={(e) => handleStarToggle(message, e)}
                    className={`p-1 transition-colors ${
                      message.isStarred
                        ? 'text-warning hover:text-warning-fg'
                        : 'text-muted hover:text-secondary dark:text-secondary dark:hover:text-muted'
                    }`}
                  >
                    <svg className="size-4" fill={message.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Sender */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`truncate asana-text-sm ${!message.isRead ? 'font-semibold text-primary' : 'text-primary'}`}>
                        {message.from.name || message.from.email}
                      </span>
                      {!message.isRead && (
                        <div className="size-2 rounded-full bg-accent-primary"></div>
                      )}
                    </div>
                    <div className="truncate asana-text-sm text-secondary dark:text-muted">
                      {message.subject}
                    </div>
                  </div>

                  {/* Snippet */}
                  <div className="hidden min-w-0 flex-1 md:block">
                    <div className="truncate asana-text-sm text-secondary dark:text-muted">
                      {message.snippet}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="asana-text-sm text-secondary dark:text-muted">
                    {formatDate(message.date)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => handleReadToggle(message, e)}
                      className="p-1 text-muted transition-colors hover:text-secondary dark:text-secondary dark:hover:text-muted"
                      title={message.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {message.isRead ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 
