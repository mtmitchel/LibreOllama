// src/pages/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInput } from '../../features/chat/components/ChatInput';
import { ChatMessageBubble } from '../../features/chat/components/ChatMessageBubble';
import { ChatHeader } from '../../features/chat/components/ChatHeader';
import { useHeader } from '../contexts/HeaderContext';
import { ContextSidebar } from '../../features/chat/components/ContextSidebar';
import { ConversationList } from '../../features/chat/components/ConversationList';
import { EmptyState } from '../../features/chat/components/EmptyState';
import { createNewMessage, ChatMessage, ChatConversation } from '../../core/lib/chatMockData';

function Chat() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  
  // --- STATE MANAGEMENT ---
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConvoListOpen, setIsConvoListOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- DATA LOADING & SYNC ---
  useEffect(() => {
    // Initialize with empty data - API integration needed
    setConversations([]);
  }, []);

  useEffect(() => {
    // Load messages for selected chat - API integration needed
    if (selectedChatId) {
      setMessages([]);
    } else {
      setMessages([]);
    }
    // Scroll to the bottom of the messages list
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId]);
  
  // --- EVENT HANDLERS ---
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;

    const userMessage = createNewMessage(newMessage, 'user');
    
    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // TODO: Send message to backend and get AI response
  }, [newMessage, selectedChatId]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
  }, []);
  
  const toggleConvoList = useCallback(() => {
    setIsConvoListOpen(!isConvoListOpen);
  }, [isConvoListOpen]);

  const toggleContext = useCallback(() => {
    setIsContextOpen(!isContextOpen);
  }, [isContextOpen]);

  const togglePinConversation = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
      ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (selectedChatId === conversationId) {
      setSelectedChatId(null);
      setMessages([]);
    }
  }, [selectedChatId]);

  const handleEditMessage = useCallback((messageId: string) => {
    // TODO: Implement message editing functionality
    console.log('Edit message:', messageId);
    alert(`Edit message: ${messageId}`);
  }, []);

  const handleCreateTaskFromMessage = useCallback((messageContent: string) => {
    // TODO: Integrate with task management system
    console.log('Create task from message:', messageContent);
    alert(`Creating task from message: "${messageContent.substring(0, 50)}..."`);
  }, []);

  // Setup header when component mounts and when selectedChat changes
  useEffect(() => {
    setHeaderProps({
      title: "Chat"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  const selectedChat = conversations.find(c => c.id === selectedChatId);

  return (
    <div 
      className="flex h-full"
      style={{ 
        background: 'var(--bg-content)',
        padding: 'var(--space-6)',
        gap: 'var(--space-6)'
      }}
    >
      {/* SIDEBAR: CONVERSATION LIST */}
      <ConversationList
        conversations={conversations}
        selectedChatId={selectedChatId}
        searchQuery={searchQuery}
        hoveredConversationId={hoveredConversationId}
        isOpen={isConvoListOpen}
        onSelectChat={handleSelectChat}
        onNewChat={() => {}} // Removed handleNewChat
        onSearchChange={setSearchQuery}
        onHoverConversation={setHoveredConversationId}
        onTogglePin={togglePinConversation}
        onDeleteConversation={deleteConversation}
        onToggle={toggleConvoList}
      />

      {/* MAIN CHAT AREA */}
      <div className="bg-bg-tertiary flex h-full flex-1 flex-col rounded-lg">
        {selectedChat ? (
          <>
            {/* Header */}
            <ChatHeader
              selectedChat={selectedChat}
            />

            {/* Messages Area with Fixed Maximum Width - Flexible Growth */}
            <div className="bg-bg-tertiary min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex h-full max-w-[1000px] flex-col gap-4 p-6">
                <div className="flex flex-1 flex-col gap-4">
                  {messages.map(message => (
                    <ChatMessageBubble 
                      key={message.id} 
                      message={message}
                      onEdit={handleEditMessage}
                      onCreateTask={handleCreateTaskFromMessage}
                    />
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area with Fixed Maximum Width - Anchored to Bottom */}
            <div className="shrink-0">
              <div className="mx-auto max-w-[1000px] px-6">
                <ChatInput
                  newMessage={newMessage}
                  selectedChatId={selectedChatId}
                  selectedChatTitle={selectedChat.title}
                  onMessageChange={setNewMessage}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </>
        ) : (
          <EmptyState onNewChat={() => {}} />
        )}
      </div>

      {/* CONTEXT SIDEBAR */}
      <ContextSidebar 
        isOpen={isContextOpen}
        conversationId={selectedChatId || undefined}
        onToggle={toggleContext}
      />
    </div>
  );
}

export default Chat;