import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Search,
  Filter,
  Plus,
  Bot,
  User,
  Copy,
  Star,
  Pin,
  Users,
  Clock,
  Image,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useHeader } from '../contexts/HeaderContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: Array<{ name: string; type: string; }>;
}

interface ChatConversation {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  isPinned?: boolean;
  tags?: string[];
  participants?: number;
}

export function Chat() {
  const { setHeaderProps, clearHeaderProps, headerProps } = useHeader();
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const conversations: ChatConversation[] = [
    {
      id: '1',
      title: 'Design system strategy',
      lastMessage: 'Let\'s discuss the component architecture...',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isPinned: true,
      tags: ['design', 'strategy'],
      participants: 2
    },
    {
      id: '2', 
      title: 'Code review session',
      lastMessage: 'The implementation looks good, but...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      tags: ['code'],
      participants: 1
    },
    {
      id: '3',
      title: 'Project planning',
      lastMessage: 'We need to prioritize the features...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      participants: 1
    }
  ];

  const messages: ChatMessage[] = [
    {
      id: '1',
      sender: 'user',
      content: 'Can you help me understand the design system structure for our chat interface?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15)
    },
    {
      id: '2',
      sender: 'ai',
      content: 'I\'d be happy to help you understand the design system structure for the chat interface. Based on the specifications, here are the key components:\n\n```css\n.chat-layout {\n  display: flex;\n  height: 100vh;\n}\n```\n\nThe chat interface follows a sidebar + main content layout with specific styling for messages, input areas, and navigation.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      attachments: [{ name: 'design-system.css', type: 'css' }]
    },
    {
      id: '3',
      sender: 'user',
      content: 'That\'s very helpful! Can you show me how to implement the message bubbles?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5)
    }
  ];

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim()) {
      // Handle sending message
      setInputMessage('');
    }
  }, [inputMessage]);

  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  const handleNewChat = useCallback(() => {
    // TODO: Implement new chat functionality
    console.log('New chat');
  }, []);

  // Stabilize secondaryActions for the header
  const secondaryActions = useMemo(() => [
    {
      label: 'Add to project',
      onClick: () => console.log('Add to project'),
      variant: 'secondary' as const
    },
    {
      label: 'Export',
      onClick: () => console.log('Export'),
      variant: 'secondary' as const
    }
  ], []); // Empty dependency array means this will be created once

  // Set page-specific header props when component mounts
  useEffect(() => {
    const newHeaderProps = {
      title: "Chat",
      primaryAction: {
        label: 'New chat',
        onClick: handleNewChat,
        icon: <Plus size={16} />
      },
      secondaryActions: secondaryActions // Use the memoized actions
    };
    // Only call setHeaderProps if the props have actually changed
    if (JSON.stringify(headerProps) !== JSON.stringify(newHeaderProps)) {
        setHeaderProps(newHeaderProps);
    }

    // Clean up header props when component unmounts
    return () => {
        // Reset to a minimal state or specific default if needed
        if (JSON.stringify(headerProps) !== JSON.stringify({})) {
             clearHeaderProps();
        }
    };
  }, [setHeaderProps, clearHeaderProps, handleNewChat, secondaryActions, headerProps]); // Added secondaryActions and headerProps

  return (
    <div className="w-full h-full flex gap-6">
      {/* Left Panel - Conversations List */}
      <div className="w-1/3 flex flex-col space-y-4">
        <Card>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 py-2 pr-3 pl-10 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-md transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </Card>

        {/* Pinned Section */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-4">
            <Star className="w-4 h-4" />
            Pinned
          </div>
          <div className="space-y-2">
            {conversations.filter(conv => conv.isPinned).map(conversation => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-bg-surface'
                }`}
                onClick={() => setSelectedChat(conversation.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-text-primary">
                    {conversation.title}
                  </h4>
                  <Pin className="w-3 h-3 text-text-secondary" />
                </div>
                {conversation.lastMessage && (
                  <p className="text-xs text-text-secondary mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    {conversation.lastMessage}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {conversation.tags?.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-bg-surface text-text-secondary rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>{formatTimestamp(conversation.timestamp)}</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {conversation.participants}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Section */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-4">
            <Clock className="w-4 h-4" />
            Recent
          </div>
          <div className="space-y-2">
            {conversations.filter(conv => !conv.isPinned).map(conversation => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-bg-surface'
                }`}
                onClick={() => setSelectedChat(conversation.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-text-primary">{conversation.title}</h4>
                  <span className="text-xs text-text-secondary">{formatTimestamp(conversation.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {conversation.tags && conversation.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-bg-surface text-text-secondary rounded">{tag}</span>
                  ))}
                  {conversation.participants && (
                    <span className="text-xs text-text-secondary flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {conversation.participants}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                  {conversation.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col" padding="none">
        {/* Chat Header */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>Workspace</span>
              <span>&gt;</span>
              <span>Chat</span>
              <span>&gt;</span>
              <span className="text-text-primary font-medium">Design system strategy</span>
            </div>
            <div className="flex items-center gap-4">
              <select className="bg-bg-surface border border-border-subtle rounded-md py-2 px-3 text-text-primary text-sm">
                <option>Claude 3.5 Sonnet</option>
                <option>GPT-4</option>
                <option>Llama 2</option>
              </select>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Ready
              </div>
              <button className="p-2 hover:bg-bg-surface rounded-md transition-colors">
                <MoreHorizontal className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map(message => (
            <div key={message.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary mb-1">
                  {message.sender === 'user' ? 'You' : 'LibreOllama Assistant'}
                </div>
                <div className="text-text-primary">
                  {message.content.includes('```') ? (
                    <div>
                      {message.content.split('```').map((part, index) => {
                        if (index % 2 === 1) {
                          const lines = part.split('\n');
                          const language = lines[0];
                          const code = lines.slice(1).join('\n');
                          return (
                            <pre key={index} className="bg-bg-surface border border-border-subtle rounded-md p-3 my-3 overflow-x-auto text-sm">
                              <div className="flex justify-between items-center mb-2 text-xs text-text-secondary">
                                <span>{language}</span>
                                <button className="flex items-center gap-1 px-2 py-1 hover:bg-bg-tertiary rounded transition-colors">
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <code>{code}</code>
                            </pre>
                          );
                        }
                        return <span key={index}>{part}</span>;
                      })}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                {message.attachments && message.attachments.map(att => (
                  <div key={att.name} className="bg-bg-surface p-3 rounded-md mt-2 flex items-center border border-border-subtle">
                    <Paperclip className="w-4 h-4 mr-2 text-text-secondary" />
                    <div>
                      <span className="font-medium text-text-primary">{att.name}</span>
                      <span className="text-xs text-text-secondary ml-2">{att.type.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-end gap-3">
            <div className="flex gap-2">
              <button className="p-2 hover:bg-bg-surface rounded-md transition-colors" title="Attach files">
                <Paperclip className="w-4 h-4 text-text-secondary" />
              </button>
              <button className="p-2 hover:bg-bg-surface rounded-md transition-colors" title="Add images">
                <Image className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 relative">
              <textarea
                className="w-full min-h-[44px] max-h-32 py-3 px-4 bg-bg-surface border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ask about design, code, or anything else... (Ctrl+Enter to send)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <button
              className={`p-3 rounded-lg transition-colors ${
                inputMessage.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-bg-surface text-text-secondary cursor-not-allowed'
              }`}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              title="Send message (Ctrl+Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Chat;
