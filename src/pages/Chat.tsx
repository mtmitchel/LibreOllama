// src/pages/Chat.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Input } from '../components/ui';
import { useHeader } from '../contexts/HeaderContext';
import { 
  Plus, Search, Bot, User, Paperclip, Send, MoreHorizontal, ChevronDown, Pin, Users, MessagesSquare, PanelLeft, PanelLeftOpen, Copy, Trash2, Download
} from 'lucide-react';

// --- Interfaces & Mock Data (Ready for Backend Integration) ---
interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned?: boolean;
  participants: number;
}

const mockConversations: ChatConversation[] = [
  { id: '1', title: 'Design system strategy', lastMessage: "Let's discuss the component architecture...", timestamp: "30m ago", isPinned: true, participants: 2 },
  { id: '2', title: 'Code review session', lastMessage: 'The implementation looks good, but...', timestamp: "2h ago", participants: 1 },
  { id: '3', title: 'Project planning', lastMessage: 'We need to prioritize the features...', timestamp: "1d ago", participants: 1 },
];

const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    { id: 'm1', sender: 'user', content: 'Can you help me understand the design system structure for our chat interface?', timestamp: '15m ago' },
    { id: 'm2', sender: 'ai', content: "I'd be happy to help! Based on the specifications, the key components are...", timestamp: '14m ago' },
    { id: 'm3', sender: 'user', content: "That's very helpful! Can you show me how to implement the message bubbles?", timestamp: '10m ago' },
  ],
  '2': [{ id: 'm4', sender: 'user', content: 'Ready for the code review.', timestamp: '2h ago' }],
  '3': [{ id: 'm5', sender: 'user', content: 'What are the Q3 project priorities?', timestamp: '1d ago' }],
};
// --- End Mock Data ---

export function Chat() {
  const { setHeaderProps } = useHeader();
  
  // --- STATE MANAGEMENT ---
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConvoListOpen, setIsConvoListOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: newMessage,
      timestamp: 'Just now',
    };
    
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
    const newConversationId = String(Date.now());
    const newConversation: ChatConversation = {
      id: newConversationId,
      title: "New Chat",
      lastMessage: "",
      timestamp: "Just now",
      participants: 1
    };
    setConversations(prev => [newConversation, ...prev]);
    setSelectedChatId(newConversationId);
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
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex gap-3">
      {/* SIDEBAR: CONVERSATION LIST */}
      {isConvoListOpen && (
        <Card className="w-80 flex flex-col" padding="none">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
            <h2 className="text-base font-semibold text-foreground">Conversations</h2>
            <button 
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all duration-200 text-sm font-medium hover:scale-[1.02]"
            >
              <Plus size={13} /> 
              New
            </button>
          </div>
          
          {/* Search */}
          <div className="p-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 py-2 pr-3 pl-10 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-background transition-all duration-200"
              />
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {/* Pinned Section */}
            {filteredConversations.some(c => c.isPinned) && (
              <div className="px-4 pt-2 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  <Pin className="w-3 h-3" />
                  Pinned
                </div>
                <div className="space-y-1">
                  {filteredConversations.filter(c => c.isPinned).map(conv => (
                    <div 
                      key={conv.id} 
                      onClick={() => handleSelectChat(conv.id)} 
                      onMouseEnter={() => setHoveredConversationId(conv.id)}
                      onMouseLeave={() => setHoveredConversationId(null)}
                      className={`relative group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedChatId === conv.id 
                          ? 'bg-accent text-accent-foreground shadow-accent/25 border border-accent/20' 
                          : 'hover:bg-muted/60 border border-transparent hover:border-border/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight line-clamp-1">{conv.title}</h4>
                          {conv.participants > 1 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Users className="w-3 h-3" />
                              <span>{conv.participants}</span>
                            </div>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{conv.lastMessage}</p>
                        )}
                        <span className="text-xs text-muted-foreground font-medium">{conv.timestamp}</span>
                      </div>
                      
                      {/* Hover Actions */}
                      {hoveredConversationId === conv.id && selectedChatId !== conv.id && (
                        <div className="absolute top-2 right-2 flex gap-0.5 p-1 bg-popover/95 backdrop-blur-sm rounded-lg shadow-lg border border-border">
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* TODO: Export conversation */ }} 
                            title="Export conversation"
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                          >
                            <Download className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePinConversation(conv.id); }} 
                            title="Unpin conversation"
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                          >
                            <Pin className="w-3 h-3 text-accent fill-accent" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} 
                            title="Delete conversation"
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Section */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                <MessagesSquare className="w-3 h-3" />
                Recent
              </div>
              <div className="space-y-1">
                {filteredConversations.filter(c => !c.isPinned).map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => handleSelectChat(conv.id)} 
                    onMouseEnter={() => setHoveredConversationId(conv.id)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                    className={`relative group p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedChatId === conv.id 
                        ? 'bg-accent text-accent-foreground shadow-accent/25 border border-accent/20' 
                        : 'hover:bg-muted/60 border border-transparent hover:border-border/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight line-clamp-1">{conv.title}</h4>
                        {conv.participants > 1 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Users className="w-3 h-3" />
                            <span>{conv.participants}</span>
                          </div>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{conv.lastMessage}</p>
                      )}
                      <span className="text-xs text-muted-foreground font-medium">{conv.timestamp}</span>
                    </div>
                    
                    {/* Hover Actions */}
                    {hoveredConversationId === conv.id && selectedChatId !== conv.id && (
                      <div className="absolute top-2 right-2 flex gap-0.5 p-1 bg-popover/95 backdrop-blur-sm rounded-lg shadow-lg border border-border">
                        <button 
                          onClick={(e) => { e.stopPropagation(); /* TODO: Export conversation */ }} 
                          title="Export conversation"
                          className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                          <Download className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); togglePinConversation(conv.id); }} 
                          title="Pin conversation"
                          className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                          <Pin className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} 
                          title="Delete conversation"
                          className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MAIN CHAT AREA */}
      <Card className="flex-1 flex flex-col" padding="none">
        {selectedChat ? (
          <>
            {/* Header */}
            <header className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleConvoList} 
                  className="p-2 hover:bg-muted rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105"
                  title={isConvoListOpen ? "Hide conversations" : "Show conversations"}
                >
                  {isConvoListOpen ? <PanelLeft size={18} /> : <PanelLeftOpen size={18} />}
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-semibold text-foreground mb-1">{selectedChat.title}</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Claude 3.5 Sonnet</span>
                      <ChevronDown size={12} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200 text-sm font-medium hover:scale-[1.02]">
                  <Download size={14} />
                  Export
                </button>
                <button className="p-2 hover:bg-muted rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 px-6 py-6 space-y-8 overflow-y-auto">
              {messages.map(message => (
                <div key={message.id} className={`flex gap-4 max-w-4xl ${message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-accent text-accent-foreground border border-accent/20' 
                      : 'bg-muted text-foreground border border-border'
                  }`}>
                    {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`flex flex-col max-w-[75%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`text-xs text-muted-foreground mb-3 ${message.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                      <span className="font-semibold">
                        {message.sender === 'user' ? 'You' : 'LibreOllama'}
                      </span>
                      <span className="mx-2">·</span>
                      <span>{message.timestamp}</span>
                    </div>
                    
                    <div className={`relative group p-4 text-sm leading-relaxed shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-accent text-accent-foreground rounded-2xl rounded-br-lg border border-accent/20'
                        : 'bg-secondary text-secondary-foreground rounded-2xl rounded-bl-lg border border-border'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Copy Button */}
                      <button
                        onClick={() => navigator.clipboard.writeText(message.content)}
                        title="Copy message"
                        className="absolute -top-2 -right-2 p-2 bg-background border border-border rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:bg-muted hover:scale-105"
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <footer className="px-6 py-5 border-t border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                 {/* Attachment Button */}
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   type="button" 
                   title="Attach files"
                   className="p-3 hover:text-accent hover:scale-105"
                  >
                   <Paperclip className="w-4 h-4" />
                 </Button>
                 
                 {/* Text Input */}
                 <div className="flex-1 relative">
                   <Input 
                    as="textarea"
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedChat?.title || 'AI'}...`}
                    className="w-full min-h-[52px] max-h-32 py-4 px-4 rounded-xl resize-none focus:ring-2 focus:ring-accent disabled:opacity-50 h-auto"
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSendMessage(e as any); // Cast to any to satisfy FormEvent requirement if needed
                      }
                    }}
                    disabled={!selectedChatId}
                    rows={1}
                   />
                 </div>
                 
                 {/* Send Button */}
                 <Button
                   type="submit"
                   variant={newMessage.trim() && selectedChatId ? "primary" : "secondary"}
                   size="icon"
                   className={`p-3.5 ${newMessage.trim() && selectedChatId ? "hover:scale-105" : ""}`}
                   disabled={!newMessage.trim() || !selectedChatId}
                   title="Send message (⌘↵)"
                 >
                   <Send className="w-4 h-4" />
                 </Button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center mb-6">
              <MessagesSquare size={36} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Welcome to LibreOllama Chat</h3>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
              Select a conversation from the list or start a new one to begin chatting with AI assistants.
            </p>
            <button 
              onClick={handleNewChat} 
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-all duration-200 font-medium hover:scale-105 shadow-sm"
            >
              <Plus size={16} />
              Start New Conversation
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Chat;