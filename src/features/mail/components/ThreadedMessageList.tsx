import React, { useState, useMemo } from 'react';
import { Star, Paperclip, ChevronRight, ChevronDown, Users } from 'lucide-react';
import { Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail, EmailThread } from '../types';
import { MailPagination } from './MailPagination';

interface ThreadItemProps {
  thread: EmailThread;
  isSelected: boolean;
  onSelect: (threadId: string, isSelected: boolean) => void;
  onThreadClick: (thread: EmailThread) => void;
  isExpanded: boolean;
  onToggleExpanded: (threadId: string) => void;
}

function ThreadItem({ 
  thread, 
  isSelected, 
  onSelect, 
  onThreadClick, 
  isExpanded, 
  onToggleExpanded 
}: ThreadItemProps) {
  const { starMessages, unstarMessages } = useMailStore();
  const { executeMessageOperation } = useMailOperation();

  // Get the latest message in the thread for display
  const latestMessage = thread.messages[thread.messages.length - 1];
  const hasUnreadMessages = thread.messages.some(msg => !msg.isRead);
  const hasStarredMessages = thread.messages.some(msg => msg.isStarred);

  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const messageIds = thread.messages.map(msg => msg.id);
    
    if (hasStarredMessages) {
      await executeMessageOperation(
        () => unstarMessages(messageIds),
        messageIds,
        'unstar'
      );
    } else {
      await executeMessageOperation(
        () => starMessages(messageIds),
        messageIds,
        'star'
      );
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(thread.id, e.target.checked);
  };

  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpanded(thread.id);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isThisYear) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getParticipantsText = () => {
    if (thread.participants.length <= 2) {
      return thread.participants.map(p => p.name || p.email).join(', ');
    }
    return `${thread.participants[0]?.name || thread.participants[0]?.email} + ${thread.participants.length - 1} others`;
  };

  return (
    <div className="border-b border-[var(--border-default)]">
      {/* Main thread row */}
      <div
        className={`cursor-pointer transition-colors duration-150 ${
          hasUnreadMessages ? 'bg-[var(--bg-tertiary)] font-medium' : 'bg-[var(--bg-tertiary)]'
        } ${isSelected ? 'bg-[var(--accent-soft)]' : ''} hover:bg-[var(--bg-secondary)]`}
        onClick={() => onThreadClick(thread)}
      >
        <div 
          className="flex items-center overflow-hidden w-full"
          style={{ 
            padding: 'var(--space-2) var(--space-3)',
            gap: 'var(--space-2)'
          }}
        >
          {/* Checkbox */}
          <div className="flex-shrink-0 w-3 flex items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-3 h-3 text-[var(--accent-primary)] bg-transparent border-[var(--border-default)] rounded-none focus:ring-[var(--accent-primary)] focus:ring-1 focus:ring-offset-0 cursor-pointer"
              style={{ transform: 'scale(0.5)' }}
            />
          </div>

          {/* Expand/Collapse toggle */}
          {thread.messageCount > 1 && (
            <div className="flex-shrink-0">
              <button
                onClick={handleToggleExpanded}
                className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={14} className="text-[var(--text-secondary)]" />
                )}
              </button>
            </div>
          )}

          {/* Star */}
          <div className="flex-shrink-0">
            <button
              onClick={handleStarClick}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors duration-150"
            >
              <Star
                size={16}
                className={`${
                  hasStarredMessages 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-[var(--border-default)] hover:text-[var(--text-secondary)]'
                } transition-colors duration-150`}
              />
            </button>
          </div>

          {/* Participants */}
          <div className="flex-shrink-0 w-32 min-w-0">
            <div className="flex items-center gap-1">
              {thread.messageCount > 1 && (
                <Users size={12} className="text-[var(--text-tertiary)] flex-shrink-0" />
              )}
              <Text 
                size="sm" 
                weight={hasUnreadMessages ? 'semibold' : 'normal'}
                variant={hasUnreadMessages ? 'body' : 'secondary'}
                className="truncate"
              >
                {getParticipantsText()}
              </Text>
            </div>
          </div>

          {/* Subject and Snippet */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-baseline min-w-0" style={{ gap: 'var(--space-1)' }}>
              <Text 
                size="sm" 
                weight={hasUnreadMessages ? 'semibold' : 'normal'}
                variant="body"
                className="truncate flex-shrink-0"
                style={{ maxWidth: '180px' }}
              >
                {truncateText(thread.subject || '(no subject)', 35)}
              </Text>
              <Text 
                size="sm" 
                variant="secondary"
                className="truncate flex-1 min-w-0"
              >
                — {truncateText(latestMessage?.snippet || '', 60)}
              </Text>
            </div>
          </div>

          {/* Message count */}
          {thread.messageCount > 1 && (
            <div className="flex-shrink-0">
              <span className="text-xs px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full">
                {thread.messageCount}
              </span>
            </div>
          )}

          {/* Attachments */}
          {thread.hasAttachments && (
            <div className="flex-shrink-0">
              <Paperclip size={14} className="text-[var(--text-secondary)]" />
            </div>
          )}

          {/* Date */}
          <div className="flex-shrink-0 w-12 text-right min-w-0">
            <Text 
              size="xs" 
              weight={hasUnreadMessages ? 'semibold' : 'normal'}
              variant={hasUnreadMessages ? 'body' : 'secondary'}
              className="truncate"
            >
              {formatDate(thread.lastMessageDate)}
            </Text>
          </div>
        </div>
      </div>

      {/* Expanded messages */}
      {isExpanded && thread.messageCount > 1 && (
        <div className="bg-[var(--bg-primary)] border-l-2 border-[var(--accent-primary)] ml-8">
          {thread.messages.slice(0, -1).map((message, index) => (
            <div
              key={message.id}
              className="cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors duration-150"
              onClick={() => onThreadClick(thread)}
            >
              <div 
                className="flex items-center overflow-hidden w-full"
                style={{ 
                  padding: 'var(--space-1) var(--space-3)',
                  gap: 'var(--space-2)'
                }}
              >
                <div className="flex-shrink-0 w-20 min-w-0">
                  <Text 
                    size="xs" 
                    weight={!message.isRead ? 'semibold' : 'normal'}
                    variant={!message.isRead ? 'body' : 'secondary'}
                    className="truncate"
                  >
                    {message.from.name || message.from.email}
                  </Text>
                </div>
                
                <div className="flex-1 min-w-0">
                  <Text 
                    size="xs" 
                    variant="secondary"
                    className="truncate"
                  >
                    {truncateText(message.snippet, 80)}
                  </Text>
                </div>
                
                <div className="flex-shrink-0 w-12 text-right">
                  <Text 
                    size="xs" 
                    variant="secondary"
                    className="truncate"
                  >
                    {formatDate(message.date)}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadedMessageList() {
  const { 
    getMessages, 
    selectedMessages, 
    selectMessage, 
    fetchThread,
    isLoadingMessages,
    error 
  } = useMailStore();
  const { executeFetchOperation } = useMailOperation();

  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const messages = getMessages();

  // Group messages into threads
  const threads = useMemo(() => {
    const threadMap = new Map<string, EmailThread>();
    
    messages.forEach(message => {
      const threadId = message.threadId;
      
      if (threadMap.has(threadId)) {
        const existingThread = threadMap.get(threadId)!;
        existingThread.messages.push(message);
        existingThread.messageCount = existingThread.messages.length;
        existingThread.lastMessageDate = new Date(Math.max(
          existingThread.lastMessageDate.getTime(),
          message.date.getTime()
        ));
        existingThread.isRead = existingThread.isRead && message.isRead;
        existingThread.isStarred = existingThread.isStarred || message.isStarred;
        existingThread.hasAttachments = existingThread.hasAttachments || message.hasAttachments;
        
        // Update participants
        const newParticipants = [message.from, ...message.to];
        newParticipants.forEach(participant => {
          if (!existingThread.participants.some(p => p.email === participant.email)) {
            existingThread.participants.push(participant);
          }
        });
      } else {
        const thread: EmailThread = {
          id: threadId,
          accountId: message.accountId,
          subject: message.subject,
          participants: [message.from, ...message.to],
          lastMessageDate: message.date,
          messageCount: 1,
          isRead: message.isRead,
          isStarred: message.isStarred,
          hasAttachments: message.hasAttachments,
          labels: message.labels,
          snippet: message.snippet,
          messages: [message]
        };
        threadMap.set(threadId, thread);
      }
    });

    // Sort messages within each thread by date
    threadMap.forEach(thread => {
      thread.messages.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    // Convert to array and sort threads by latest message date
    return Array.from(threadMap.values()).sort((a, b) => 
      b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
    );
  }, [messages]);

  const handleThreadClick = async (thread: EmailThread) => {
    await executeFetchOperation(
      () => fetchThread(thread.id),
      'thread details'
    );
  };

  const handleSelect = (threadId: string, isSelected: boolean) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.messages.forEach(message => {
        selectMessage(message.id, isSelected);
      });
    }
  };

  const handleToggleExpanded = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  if (error) {
    const handleRetry = async () => {
      await executeFetchOperation(
        () => useMailStore.getState().fetchMessages(),
        'messages'
      );
    };

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" style={{ marginBottom: 'var(--space-2)' }}>
            Unable to load messages
          </Text>
          <Text size="sm" variant="secondary" style={{ marginBottom: 'var(--space-3)' }}>
            {error}
          </Text>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-primary-hover)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="secondary">
            Loading conversations...
          </Text>
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" style={{ marginBottom: 'var(--space-2)' }}>
            No conversations found
          </Text>
          <Text size="sm" variant="secondary">
            Your inbox is empty or try a different search.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="min-h-full">
          {threads.map((thread) => {
            const isSelected = thread.messages.some(msg => selectedMessages.includes(msg.id));
            const isExpanded = expandedThreads.has(thread.id);
            
            return (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isSelected={isSelected}
                onSelect={handleSelect}
                onThreadClick={handleThreadClick}
                isExpanded={isExpanded}
                onToggleExpanded={handleToggleExpanded}
              />
            );
          })}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex-shrink-0">
        <MailPagination />
      </div>
    </div>
  );
} 