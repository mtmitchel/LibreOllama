// src/pages/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInput } from '../../features/chat/components/ChatInput';
import { ChatMessageBubble } from '../../features/chat/components/ChatMessageBubble';
import { ChatHeader } from '../../features/chat/components/ChatHeader';
import { useHeader } from '../contexts/HeaderContext';
import { ContextSidebar } from '../../features/chat/components/ContextSidebar';
import { ConversationList } from '../../features/chat/components/ConversationList';
import { EmptyState } from '../../features/chat/components/EmptyState';
import { useChatStore } from '../../features/chat/stores/chatStore';

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
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
  const handleRenameConversation = useCallback((conversationId: string) => {
    // TODO: Implement conversation renaming
    console.log('Rename conversation:', conversationId);
  }, []);

  const handleArchiveConversation = useCallback((conversationId: string) => {
    // TODO: Implement conversation archiving
    console.log('Archive conversation:', conversationId);
  }, []);

  const handleExportConversation = useCallback((conversationId: string) => {
    // TODO: Implement conversation export
    console.log('Export conversation:', conversationId);
  }, []);

  const handleShareConversation = useCallback((conversationId: string) => {
    // TODO: Implement conversation sharing
    console.log('Share conversation:', conversationId);
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
  useEffect(() => {
    setHeaderProps({
      title: 'Chat',
      subtitle: selectedChat ? selectedChat.title : 'Select a conversation or create a new one'
    });

    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, selectedChat]);

  // --- ERROR DISPLAY ---
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <button 
            onClick={clearError}
            className="hover:bg-primary/80 rounded bg-primary px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="flex h-full gap-6 bg-primary p-6">
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
        onArchiveConversation={handleArchiveConversation}
        onExportConversation={handleExportConversation}
        onShareConversation={handleShareConversation}
      />

      {/* Main Chat Area */}
      <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              selectedChat={selectedChat}
            />

            {/* Messages Area */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-secondary">Loading messages...</div>
                    </div>
                  ) : currentMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-secondary">
                        <p>No messages yet.</p>
                        <p>Start a conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentMessages.map((message) => (
                        <ChatMessageBubble
                          key={message.id}
                          message={message}
                          variant="ghost"
                          onRegenerate={handleRegenerate}
                        />
                      ))}
                      {isSending && (
                        <div className="flex items-center space-x-2 text-secondary">
                          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span>AI is typing...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <ChatInput
                  newMessage={newMessage}
                  selectedChatId={selectedConversationId}
                  selectedChatTitle={selectedChat?.title}
                  onMessageChange={setNewMessage}
                  onSendMessage={handleSendMessage}
                  disabled={isSending || isLoadingMessages}
                />
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-1 items-center justify-center">
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
  );
}

export default Chat;