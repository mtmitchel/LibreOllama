import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  MessageSquare,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Settings,
  Archive,
  Trash2,
  Star,
  Pin,
  Users,
  Clock,
  Image
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { PageLayout } from '../components/ui/PageLayout';
import { Card } from '../components/ui/Card';

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

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      // Handle sending message
      setInputMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <PageLayout>
      <div className="chat-layout">
      {/* Chat Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button className="btn btn-primary w-full mb-4">
            <Plus className="w-4 h-4 mr-2" />
            New chat
          </button>
        </div>

        <div className="chat-search-filter-wrapper">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 py-2 pr-3 pl-10 bg-bg-elevated border border-border-default rounded-md text-text-primary text-sm"
            />
          </div>
          <button className="btn-filter btn btn-ghost h-10 px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Filter
          </button>
        </div>

        <div className="chat-list">
          {/* Pinned Section */}
          <div className="chat-list-section">
            <div className="chat-list-section-title">
              <Star className="w-3.5 h-3.5" />
              Pinned
            </div>
            {conversations.filter(conv => conv.isPinned).map(conversation => (
              <div 
                key={conversation.id}
                className={`chat-list-item ${selectedChat === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conversation.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-medium text-text-primary m-0">
                    {conversation.title}
                  </h4>
                  <Pin className="w-3 h-3 text-text-muted" />
                </div>
                {conversation.lastMessage && (
                  <p className="text-xs text-text-secondary m-0 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    {conversation.lastMessage}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {conversation.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <span>{formatTimestamp(conversation.timestamp)}</span>
                    <div className="flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      {conversation.participants}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Section */}
          <div className="chat-list-section">
            <div className="chat-list-section-title">
              <Clock className="w-3.5 h-3.5" />
              Recent
            </div>
            {conversations.filter(conv => !conv.isPinned).map(conversation => (
              <div 
                key={conversation.id}
                className={`chat-list-item ${selectedChat === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conversation.id)}
              >
<div className="mb-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="text-sm font-semibold text-text-primary m-0">{conversation.title}</h4>
                    <span className="text-xs text-text-tertiary">{formatTimestamp(conversation.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {conversation.tags && conversation.tags.map(tag => (
                      <span key={tag} className="chat-item-tag">{tag}</span>
                    ))}
                    {conversation.participants && (
                      <span className="text-[11px] text-text-tertiary flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {conversation.participants}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-text-secondary m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                  {conversation.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <Card className="chat-main">
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">&gt;</span>
              <span>Chat</span>
              <span className="breadcrumb-separator">&gt;</span>
              <span className="breadcrumb-current">Design system strategy</span>
            </div>
          </div>
          <div className="chat-header-controls">
            <div className="model-selector-main-header flex items-center gap-3 mr-4">
              <select className="bg-bg-elevated border border-border-default rounded-md py-2 px-3 text-text-primary text-[13px] min-w-[140px]">
                <option>Claude 3.5 Sonnet</option>
                <option>GPT-4</option>
                <option>Llama 2</option>
              </select>
              <div className="flex items-center gap-1 text-[11px] text-success">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                Ready
              </div>
            </div>
            <div className="chat-actions flex gap-2">
              <button className="btn btn-ghost p-2 text-xs">
                Add to project
              </button>
              <button className="btn btn-ghost p-2 text-xs">
                Export
              </button>
              <button className="btn btn-ghost p-2">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="chat-messages">
          {messages.map(message => (
            <Card key={message.id} className={`message ${message.sender} mb-4`}>
              <div className="flex gap-3">
                <div className="message-avatar">
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className="message-content-wrapper flex-1">
                  <div className="message-sender">
                    {message.sender === 'user' ? 'You' : 'LibreOllama Assistant'}
                  </div>
                  <div className="message-content">
                  {message.content.includes('```') ? (
                    <div>
                      {message.content.split('```').map((part, index) => {
                        if (index % 2 === 1) {
                          const lines = part.split('\n');
                          const language = lines[0];
                          const code = lines.slice(1).join('\n');
                          return (
                            <pre key={index} className={`${message.sender === 'user' ? 'bg-white/10' : 'bg-bg-tertiary'} border border-border-default rounded-md p-3 my-3 overflow-x-auto relative text-[13px] leading-6`}>
                              <div className="code-header flex justify-between items-center mb-2 text-xs text-text-tertiary">
                                <span>{language}</span>
<button className="code-block-copy-button">
                      <Copy className="w-3.5 h-3.5 mr-1" />
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
                      <div key={att.name} className="chat-message-attachment bg-bg-elevated p-2 px-3 rounded-md mt-2 flex items-center border border-border-subtle">
                        <Paperclip className="w-4 h-4 mr-2 text-text-secondary" /> 
                        <div>
                          <span className="font-medium text-text-primary">{att.name}</span>
                          <span className="text-xs text-text-tertiary ml-2">{att.type.toUpperCase()}</span>
                        </div>
                        {/* Add file size/actions here later */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
      <Card className="chat-input-area">
        <div className="chat-input-wrapper">
          <div className="chat-input-tools">
            <button className="chat-input-tool" title="Attach files">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="chat-input-tool" title="Add images">
              <Image className="w-4 h-4" />
            </button>
          </div>
          <textarea 
            className="chat-input"
            placeholder="Ask about design, code, or anything else... (Ctrl+Enter to send)"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage();
              }
            }}
          />
          <button 
            className="chat-send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            title="Send message (Ctrl+Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Card>

    </PageLayout>
  );
}

export default Chat;
