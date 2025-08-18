// src/pages/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChatInput } from '../../features/chat/components/ChatInput';
import { ChatMessageBubble } from '../../features/chat/components/ChatMessageBubble';
import { ChatHeader } from '../../features/chat/components/ChatHeader';
import { useHeader } from '../contexts/HeaderContext';
import { ContextSidebar } from '../../features/chat/components/ContextSidebar';
import { ConversationList } from '../../features/chat/components/ConversationList';
import { EmptyState } from '../../features/chat/components/EmptyState';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { Page, PageCard } from '../../components/ui/design-system/Page';

function Chat() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  
  // --- ZUSTAND STORE ---
  const {
    conversations,
    messages,
    selectedConversationId,
    isLoading,
    isLoadingMessages,
    isSending,
    error,
    searchQuery,
    // Actions
    fetchConversations,
    createConversation,
    deleteConversation,
    selectConversation,
    togglePinConversation,
    setSearchQuery,
    fetchMessages,
    sendMessage,
    regenerateResponse,
    clearError
  } = useChatStore();
  
  // --- LOCAL UI STATE ---
  const [newMessage, setNewMessage] = useState('');
  const [isConvoListOpen, setIsConvoListOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousConversationIdRef = useRef<string | null>(null);

  // --- DATA LOADING & SYNC ---
  useEffect(() => {
    // Load conversations on mount
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    // Clear any errors when component mounts
    clearError();
  }, [clearError]);

  useEffect(() => {
    // Determine if we should scroll instantly or smoothly
    const isConversationChange = previousConversationIdRef.current !== selectedConversationId;
    const scrollBehavior = isInitialLoadRef.current || isConversationChange ? 'instant' : 'smooth';
    
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior as ScrollBehavior });
    
    // Update refs after scrolling
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
    previousConversationIdRef.current = selectedConversationId;
  }, [messages, selectedConversationId]);
  
  // --- EVENT HANDLERS ---
  const handleSendMessage = useCallback(async (e: React.FormEvent, attachments?: any[]) => {
    e.preventDefault();
    const hasText = newMessage.trim();
    const hasAttachments = attachments && attachments.length > 0;
    
    if ((!hasText && !hasAttachments) || !selectedConversationId || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    
    try {
      // If there are attachments, include them in the message
      if (hasAttachments) {
        const messageWithAttachments = messageContent 
          ? `${messageContent}\n\n[Attachments: ${attachments.map(att => att.filename).join(', ')}]`
          : `[Attachments: ${attachments.map(att => att.filename).join(', ')}]`;
        
        await sendMessage(selectedConversationId, messageWithAttachments);
        console.log('Sent message with attachments:', attachments);
      } else {
        await sendMessage(selectedConversationId, messageContent);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is managed by the store
    }
  }, [newMessage, selectedConversationId, isSending, sendMessage]);

  const handleNewChat = useCallback(async () => {
    try {
      const newConversationId = await createConversation();
      selectConversation(newConversationId);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [createConversation, selectConversation]);

  const handleSelectChat = useCallback((chatId: string) => {
    selectConversation(chatId);
  }, [selectConversation]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    console.log('🗂️ Chat.tsx handleDeleteConversation called with ID:', conversationId);
    try {
      await deleteConversation(conversationId);
      console.log('✅ Chat.tsx handleDeleteConversation completed successfully');
    } catch (error) {
      console.error('❌ Chat.tsx: Failed to delete conversation:', error);
    }
  }, [deleteConversation]);

  const handleTogglePin = useCallback((conversationId: string) => {
    togglePinConversation(conversationId);
  }, [togglePinConversation]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // --- CONTEXT MENU HANDLERS ---
  const handleRenameConversation = useCallback(async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Simple prompt for new name
    const newTitle = prompt('Enter new conversation title:', conversation.title);
    if (newTitle && newTitle.trim() && newTitle !== conversation.title) {
      try {
        // Update title in backend
        await invoke('update_session_title', {
          sessionIdStr: conversationId,
          newTitle: newTitle.trim()
        });
        
        // Refresh conversations to show the update
        await fetchConversations();
      } catch (error) {
        console.error('Failed to rename conversation:', error);
      }
    }
  }, [conversations, fetchConversations]);

  const handleExportConversation = useCallback((conversationId: string) => {
    // Export is now handled in the ConversationContextMenu component
    console.log('Export conversation:', conversationId);
  }, []);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (!selectedConversationId) return;
    try {
      await regenerateResponse(selectedConversationId, messageId);
    } catch (error) {
      console.error('Failed to regenerate response:', error);
    }
  }, [selectedConversationId, regenerateResponse]);

  // --- DERIVED DATA ---
  const selectedChat = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId) 
    : null;
  
  const currentMessages = selectedConversationId 
    ? messages[selectedConversationId] || [] 
    : [];

  // --- HEADER CONFIGURATION ---
  // Chat has its own header, so we don't need the unified header
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // --- ERROR DISPLAY ---
  // Render error as an overlay instead of replacing the entire UI

  // --- RENDER ---
  return (
    <Page full>
      <PageCard>
    <div
      className="asana-chat"
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--asana-bg-secondary)',
        padding: `${24}px ${isContextOpen ? 24 : 0}px ${24}px ${isConvoListOpen ? 24 : 0}px`,
        gap: isConvoListOpen ? '24px' : '0px'
      }}
    >
      {/* Left Sidebar - Conversation List */}
      <ConversationList
        conversations={conversations}
        selectedChatId={selectedConversationId}
        searchQuery={searchQuery}
        isOpen={isConvoListOpen}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onSearchChange={handleSearchChange}
        onHoverConversation={setHoveredConversationId}
        onTogglePin={handleTogglePin}
        onDeleteConversation={handleDeleteConversation}
        onToggle={() => setIsConvoListOpen(!isConvoListOpen)}
        onRenameConversation={handleRenameConversation}
        onExportConversation={handleExportConversation}
      />

      {/* Main + Right Context grouped so their internal gap remains 24px */}
      <div style={{ display: 'flex', gap: isContextOpen ? '24px' : '0px', flex: 1 }}>
        {/* Main Chat Area */}
        <div className="asana-chat-main">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              selectedChat={selectedChat}
            />

            {/* Messages Area */}
            <div className="asana-chat-messages">
              {isLoadingMessages ? (
                <div className="asana-empty">
                  <div className="asana-empty-title">Loading messages...</div>
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="asana-empty">
                  <div className="asana-empty-title">No messages yet.</div>
                  <div className="asana-empty-description">Start a conversation!</div>
                </div>
              ) : (
                <>
                  {currentMessages.map((message) => (
                    <ChatMessageBubble
                      key={message.id}
                      message={message}
                      variant="ghost"
                      onRegenerate={handleRegenerate}
                    />
                  ))}
                  {isSending && (
                    <div className="asana-chat-typing">
                      <div className="asana-chat-typing-dots">
                        <div className="asana-chat-typing-dot"></div>
                        <div className="asana-chat-typing-dot"></div>
                        <div className="asana-chat-typing-dot"></div>
                      </div>
                      <span>AI is typing...</span>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="asana-chat-input-container">
              <ChatInput
                newMessage={newMessage}
                selectedChatId={selectedConversationId}
                selectedChatTitle={selectedChat?.title}
                onMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                disabled={isSending || isLoadingMessages}
              />
            </div>
          </>
          ) : (
            /* Empty State */
            <div className="asana-empty">
              <EmptyState onNewChat={handleNewChat} />
            </div>
          )}
        </div>

        {/* Context Sidebar */}
        <ContextSidebar
          isOpen={isContextOpen}
          conversationId={selectedConversationId || undefined}
          onToggle={() => setIsContextOpen(!isContextOpen)}
        />
      </div>
    </div>
      
      {/* Error Notification Overlay */}
      {error && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={clearError}
        >
          <div 
            className="max-w-md rounded-lg bg-white p-6 shadow-2xl border border-red-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg 
                  className="h-6 w-6 text-red-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Error
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {error}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={clearError}
                className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      </PageCard>
    </Page>
  );
}

export default Chat;