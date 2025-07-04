// src/pages/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../../components/ui';
import { useHeader } from '../contexts/HeaderContext';
import { Plus } from 'lucide-react';

// Import chat components and data
import { 
  ConversationList, 
  ChatMessageBubble, 
  ChatInput, 
  ChatHeader, 
  EmptyState 
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
    <div className="w-full h-full flex gap-4 md:gap-6 p-4 md:p-6">
      {/* SIDEBAR: CONVERSATION LIST */}
      {isConvoListOpen && (
        <ConversationList
          conversations={conversations}
          selectedChatId={selectedChatId}
          searchQuery={searchQuery}
          hoveredConversationId={hoveredConversationId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onSearchChange={setSearchQuery}
          onHoverConversation={setHoveredConversationId}
          onTogglePin={togglePinConversation}
          onDeleteConversation={deleteConversation}
        />
      )}

      {/* MAIN CHAT AREA */}
      <Card className="flex-1 flex flex-col" padding="none">
        {selectedChat ? (
          <>
            {/* Header */}
            <ChatHeader
              selectedChat={selectedChat}
              isConvoListOpen={isConvoListOpen}
              onToggleConvoList={toggleConvoList}
            />

            {/* Messages */}
            <div className="flex-1 px-6 py-6 space-y-8 overflow-y-auto bg-background/30">
              {messages.map(message => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput
              newMessage={newMessage}
              selectedChatId={selectedChatId}
              selectedChatTitle={selectedChat.title}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <EmptyState onNewChat={handleNewChat} />
        )}
      </Card>
    </div>
  );
}

export default Chat;