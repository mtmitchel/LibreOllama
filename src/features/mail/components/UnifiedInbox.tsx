import React, { useState, useMemo, useCallback } from 'react';
import { useMailStore } from '../stores/mailStore';
import { ParsedEmail, EmailAddress, GmailAccount } from '../types';
import { handleGmailError } from '../services/gmailErrorHandler';
import { ErrorDisplay } from './ErrorDisplay';
import { MailPagination } from './MailPagination';
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
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500',
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
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Unified Inbox Disabled
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enable unified inbox in settings to view emails from all accounts in one place.
          </p>
          <button
            onClick={() => useMailStore.getState().updateSettings({ enableUnifiedInbox: true })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
          >
            Enable Unified Inbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Unified Inbox
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredAndSortedMessages.length} message{filteredAndSortedMessages.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Account Filter */}
          <select
            value={selectedAccountFilter || ''}
            onChange={(e) => setSelectedAccountFilter(e.target.value || null)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.displayName} ({account.email})
              </option>
            ))}
          </select>

          {/* Show Only Unread */}
          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => setShowOnlyUnread(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500"
            />
            <span>Unread only</span>
          </label>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'sender' | 'subject')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="sender">Sort by Sender</option>
              <option value="subject">Sort by Subject</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <svg className={`w-4 h-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</span>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8v.01M6 5v.01" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No messages found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  className={`flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${!message.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectMessage(message, e)}
                    className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Account Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getAccountColor(message.accountId)}`} title={account?.email}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                      {account?.displayName?.substring(0, 10)}
                    </span>
                  </div>

                  {/* Star */}
                  <button
                    onClick={(e) => handleStarToggle(message, e)}
                    className={`p-1 transition-colors ${
                      message.isStarred
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={message.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Sender */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm truncate ${!message.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {message.from.name || message.from.email}
                      </span>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {message.subject}
                    </div>
                  </div>

                  {/* Snippet */}
                  <div className="flex-1 min-w-0 hidden md:block">
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {message.snippet}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(message.date)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleReadToggle(message, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      title={message.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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