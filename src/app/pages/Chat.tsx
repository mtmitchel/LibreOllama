// src/pages/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Plus } from 'lucide-react';

// Import chat components and data
import { 
  ConversationList, 
  ChatMessageBubble, 
  ChatInput, 
  ChatHeader, 
  EmptyState,
  ContextSidebar
} from "../../features/chat/components";
import {
  ChatMessage,
  mockConversations,
  mockMessages,
  createNewConversation,
  createNewMessage
} from "../../core/lib/chatMockData";

export function Chat() {
  const { setHeaderProps } = useHeader();
  
  // --- STATE MANAGEMENT ---
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConvoListOpen, setIsConvoListOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- DATA LOADING & SYNC ---
  useEffect(() => {
    // Simulate fetching conversations (replace with actual API call)
    setConversations(mockConversations);
    const defaultChat = mockConversations.find(c => c.isPinned) || mockConversations[0];
    if (defaultChat) {
      setSelectedChatId(defaultChat.id);
    }
  }, []);

  useEffect(() => {
    // Simulate fetching messages when a chat is selected
    if (selectedChatId) {
      setMessages(mockMessages[selectedChatId] || []);
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

  const handleNewChat = useCallback(() => {
    const newConversation = createNewConversation("New Chat");
    setConversations(prev => [newConversation, ...prev]);
    setSelectedChatId(newConversation.id);
    setMessages([]);
  }, []);

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
    const selectedChat = conversations.find(c => c.id === selectedChatId);
    setHeaderProps({
      title: selectedChat ? selectedChat.title : "Chat",
      breadcrumb: selectedChat 
        ? [{label: "Chat", onClick: () => setSelectedChatId(null)}, {label: selectedChat.title}] 
        : [{label: "Chat"}],
      primaryAction: {
        label: 'New chat',
        onClick: handleNewChat,
        icon: <Plus size={16} />
      }
    });
  }, [setHeaderProps, handleNewChat, selectedChatId, conversations]);

  const selectedChat = conversations.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
      {/* SIDEBAR: CONVERSATION LIST */}
      <ConversationList
        conversations={conversations}
        selectedChatId={selectedChatId}
        searchQuery={searchQuery}
        hoveredConversationId={hoveredConversationId}
        isOpen={isConvoListOpen}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onSearchChange={setSearchQuery}
        onHoverConversation={setHoveredConversationId}
        onTogglePin={togglePinConversation}
        onDeleteConversation={deleteConversation}
        onToggle={toggleConvoList}
      />

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]">
        {selectedChat ? (
          <>
            {/* Header */}
            <ChatHeader
              selectedChat={selectedChat}
            />

            {/* Messages Area with Fixed Maximum Width - Flexible Growth */}
            <div 
              className="flex-1 overflow-y-auto bg-[var(--bg-tertiary)] min-h-0"
            >
              <div className="max-w-[1000px] mx-auto p-[var(--space-6)] flex flex-col gap-[var(--space-4)] h-full">
                <div className="flex-1 flex flex-col gap-[var(--space-4)]">
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
            <div className="flex-shrink-0">
              <div className="max-w-[1000px] mx-auto px-[var(--space-6)]">
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
          <EmptyState onNewChat={handleNewChat} />
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