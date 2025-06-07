import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Folder, 
  Clock, 
  ChevronDown,
  Send,
  Paperclip,
  Image,
  Copy,
  MoreHorizontal,
  Pin,
  Tag,
  Archive,
  Trash2,
  Users,
  Bot,
  User
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Message } from '../lib/types';

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
    <div className="chat-layout">
      {/* Chat Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
            <Plus style={{ width: '16px', height: '16px', marginRight: 'var(--space-2)' }} />
            New chat
          </button>
        </div>

        <div className="chat-search-filter-wrapper">
          <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
            <Search style={{ 
              position: 'absolute', 
              left: 'var(--space-3)', 
              top: '50%', 
              transform: 'translateY(-50%)',
              width: '16px', 
              height: '16px', 
              color: 'var(--text-muted)' 
            }} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-10)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
          </div>
          <button className="btn-filter btn btn-ghost" style={{ height: '40px', padding: 'var(--space-2) var(--space-3)', fontSize: '12px' }}>
            <Filter style={{ width: '14px', height: '14px', marginRight: 'var(--space-1)' }} />
            Filter
          </button>
        </div>

        <div className="chat-list">
          {/* Pinned Section */}
          <div className="chat-list-section">
            <div className="chat-list-section-title">
              <Star style={{ width: '14px', height: '14px' }} />
              Pinned
            </div>
            {conversations.filter(conv => conv.isPinned).map(conversation => (
              <div 
                key={conversation.id}
                className={`chat-list-item ${selectedChat === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conversation.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-1)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}>
                    {conversation.title}
                  </h4>
                  <Pin style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                </div>
                {conversation.lastMessage && (
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)', 
                    margin: '0 0 var(--space-2) 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conversation.lastMessage}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    {conversation.tags?.map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{formatTimestamp(conversation.timestamp)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Users style={{ width: '10px', height: '10px' }} />
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
              <Clock style={{ width: '14px', height: '14px' }} />
              Recent
            </div>
            {conversations.filter(conv => !conv.isPinned).map(conversation => (
              <div 
                key={conversation.id}
                className={`chat-list-item ${selectedChat === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conversation.id)}
              >
<div style={{ marginBottom: 'var(--space-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-0-5)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{conversation.title}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{formatTimestamp(conversation.timestamp)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {conversation.tags && conversation.tags.map(tag => (
                      <span key={tag} className="chat-item-tag">{tag}</span>
                    ))}
                    {conversation.participants && (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                        <Users style={{ width: '12px', height: '12px', marginRight: 'var(--space-1)' }} />
                        {conversation.participants}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conversation.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="chat-main">
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
            <div className="model-selector-main-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginRight: 'var(--space-4)' }}>
              <select style={{
                padding: 'var(--space-2) var(--space-3)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                minWidth: '160px'
              }}>
                <option>Claude 3.5 Sonnet</option>
                <option>GPT-4</option>
                <option>Llama 2</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px', color: 'var(--success)' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }}></div>
                Ready
              </div>
            </div>
            <div className="chat-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-ghost" style={{ padding: 'var(--space-2)', fontSize: '12px' }}>
                Add to project
              </button>
              <button className="btn btn-ghost" style={{ padding: 'var(--space-2)', fontSize: '12px' }}>
                Export
              </button>
              <button className="btn btn-ghost" style={{ padding: 'var(--space-2)' }}>
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        </header>

        <div className="chat-messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-avatar">
                {message.sender === 'user' ? (
                  <User style={{ width: '16px', height: '16px' }} />
                ) : (
                  <Bot style={{ width: '16px', height: '16px' }} />
                )}
              </div>
              <div className="message-content-wrapper">
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
                            <pre key={index} style={{ 
                              background: message.sender === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--bg-tertiary)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--space-3)',
                              margin: 'var(--space-3) 0',
                              overflowX: 'auto',
                              position: 'relative',
                              fontSize: '13px',
                              lineHeight: '1.6'
                            }}>
                              <div className="code-header" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: 'var(--space-2)',
                                fontSize: '12px',
                                color: 'var(--text-tertiary)'
                              }}>
                                <span>{language}</span>
<button className="code-block-copy-button">
                      <Copy style={{ width: '14px', height: '14px', marginRight: 'var(--space-1)' }} />
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
                      <div key={att.name} className="chat-message-attachment" style={{ /* Basic styles, to be enhanced in CSS */
                        background: 'var(--bg-elevated)', 
                        padding: 'var(--space-2) var(--space-3)', 
                        borderRadius: 'var(--radius-md)', 
                        marginTop: 'var(--space-2)',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <Paperclip style={{ width: '16px', height: '16px', marginRight: 'var(--space-2)', color: 'var(--text-secondary)' }} /> 
                        <div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{att.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)' }}>{att.type.toUpperCase()}</span>
                        </div>
                        {/* Add file size/actions here later */}
                      </div>
                    ))}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <div className="chat-input-tools">
              <button className="chat-input-tool" title="Attach files">
                <Paperclip style={{ width: '16px', height: '16px' }} />
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
              <Send style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
