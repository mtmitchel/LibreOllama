import React, { useState, useMemo } from 'react';
import { Star, Paperclip, ChevronRight, ChevronDown, Users } from 'lucide-react';
import { Text, Card, EmptyState } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail, EmailThread } from '../types';

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
    <div className="border-border-default border-b">
      {/* Main thread row */}
      <div
        className={`cursor-pointer transition-colors duration-150 ${
          hasUnreadMessages ? 'bg-tertiary font-medium' : 'bg-tertiary'
        } ${isSelected ? 'bg-accent-soft' : ''} hover:bg-secondary`}
        onClick={() => onThreadClick(thread)}
      >
        <div 
          className="flex w-full items-center overflow-hidden"
          style={{ 
            padding: 'var(--space-2) var(--space-3)',
            gap: 'var(--space-2)'
          }}
        >
          {/* Checkbox */}
          <div className="flex w-3 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="border-border-default focus:ring-accent-primary size-3 cursor-pointer rounded-none bg-transparent text-accent-primary focus:ring-1 focus:ring-offset-0"
              style={{ transform: 'scale(0.5)' }}
            />
          </div>

          {/* Expand/Collapse toggle */}
          {thread.messageCount > 1 && (
            <div className="shrink-0">
              <button
                onClick={handleToggleExpanded}
                className="rounded p-1 transition-colors duration-150 hover:bg-tertiary"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-secondary" />
                ) : (
                  <ChevronRight size={14} className="text-secondary" />
                )}
              </button>
            </div>
          )}

          {/* Star */}
          <div className="shrink-0">
            <button
              onClick={handleStarClick}
              className="rounded p-1 transition-colors duration-150 hover:bg-tertiary"
            >
              <Star
                size={16}
                className={`${
                  hasStarredMessages 
                    ? 'fill-warning text-warning' 
                    : 'text-border-primary hover:text-text-secondary'
                } transition-colors duration-150`}
              />
            </button>
          </div>

          {/* Participants */}
          <div className="w-32 min-w-0 shrink-0">
            <div className="flex items-center gap-1">
              {thread.messageCount > 1 && (
                <Users size={12} className="shrink-0 text-muted" />
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
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-baseline" className="gap-1">
              <Text 
                size="sm" 
                weight={hasUnreadMessages ? 'semibold' : 'normal'}
                variant="body"
                className="shrink-0 truncate"
                style={{ maxWidth: '180px' }}
              >
                {truncateText(thread.subject || '(no subject)', 35)}
              </Text>
              <Text 
                size="sm" 
                variant="secondary"
                className="min-w-0 flex-1 truncate"
              >
                — {truncateText(latestMessage?.snippet || '', 60)}
              </Text>
            </div>
          </div>

          {/* Message count */}
          {thread.messageCount > 1 && (
            <div className="shrink-0">
              <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary">
                {thread.messageCount}
              </span>
            </div>
          )}

          {/* Attachments */}
          {thread.hasAttachments && (
            <div className="shrink-0">
              <Paperclip size={14} className="text-secondary" />
            </div>
          )}

          {/* Date */}
          <div className="w-12 min-w-0 shrink-0 text-right">
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
        <div className="ml-8 border-l-2 border-accent-primary bg-primary">
          {thread.messages.slice(0, -1).map((message, index) => (
            <div
              key={message.id}
              className="cursor-pointer transition-colors duration-150 hover:bg-secondary"
              onClick={() => onThreadClick(thread)}
            >
              <div 
                className="flex w-full items-center overflow-hidden"
                style={{ 
                  padding: 'var(--space-1) var(--space-3)',
                  gap: 'var(--space-2)'
                }}
              >
                <div className="w-20 min-w-0 shrink-0">
                  <Text 
                    size="xs" 
                    weight={!message.isRead ? 'semibold' : 'normal'}
                    variant={!message.isRead ? 'body' : 'secondary'}
                    className="truncate"
                  >
                    {message.from.name || message.from.email}
                  </Text>
                </div>
                
                <div className="min-w-0 flex-1">
                  <Text 
                    size="xs" 
                    variant="secondary"
                    className="truncate"
                  >
                    {truncateText(message.snippet, 80)}
                  </Text>
                </div>
                
                <div className="w-12 shrink-0 text-right">
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
    console.log('🔍 [DEBUG] Thread clicked:', {
      threadId: thread.id,
      subject: thread.subject,
      messageCount: thread.messageCount
    });
    
    try {
      // Immediate fallback: Set the latest message from the thread directly
      // This ensures the email view opens instantly
      const latestMessage = thread.messages[thread.messages.length - 1];
      useMailStore.setState({ 
        currentMessage: latestMessage,
        currentThread: thread,
        isLoading: false,
        error: null 
      });
      
      console.log('🚀 [DEBUG] Set thread message immediately from list data');
      
      // Try to fetch full thread details in the background
      try {
        await executeFetchOperation(
          () => fetchThread(thread.id),
          'thread details'
        );
        
        console.log('✅ [DEBUG] Full thread details fetched successfully');
      } catch (fetchError) {
        console.warn('⚠️ [DEBUG] Full thread fetch failed, using list data:', fetchError);
        // Keep the message/thread from list data - it's better than nothing
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Thread click failed completely:', error);
      useMailStore.setState({ 
        error: `Failed to open thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
    }
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" className="mb-2">
            Unable to load messages
          </Text>
          <Text size="sm" variant="secondary" className="mb-3">
            {error}
          </Text>
          <button
            onClick={handleRetry}
            className="hover:bg-accent-primary-hover rounded bg-accent-primary px-4 py-2 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center">
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
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          title="No conversations found"
          message="Your inbox is empty or try a different search."
          icon="📧"
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
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
    </div>
  );
} 