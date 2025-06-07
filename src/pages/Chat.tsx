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
  Pin,
  Users,
  Clock,
  Image,
  MoreHorizontal,
  Trash2,
  Download,
  MessageSquare,
  PanelLeftClose, // Added for collapse toggle
  PanelLeftOpen // Added for expand toggle
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
  const { setHeaderProps, headerProps } = useHeader();
  // Assuming you have state like this
  const [isConvoColumnOpen, setConvoColumnOpen] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>('1'); // Renamed from selectedChat to selectedChatId for clarity
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<{ pinnedStatus: 'all' | 'pinned' | 'unpinned' }>({ pinnedStatus: 'all' });
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false); // State for chat options dropdown
  // const [isConversationSidebarCollapsed, setIsConversationSidebarCollapsed] = useState(false); // Replaced by isConvoColumnOpen

  const initialConversations: ChatConversation[] = [
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

  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);

  const handleToggleColumn = () => {
    const isClosing = isConvoColumnOpen;
    setConvoColumnOpen(!isClosing);

    // FIX: If the column is being closed, reset the selected chat ID.
    // This prevents the main panel from trying to render a now-hidden item.
    if (isClosing) {
      setSelectedChatId(null);
    }
  };

  // Find the full chat object from the ID
  const selectedChat = conversations.find(c => c.id === selectedChatId);

  const initialMessages: ChatMessage[] = [
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

  const [messagesState, setMessagesState] = useState<ChatMessage[]>(initialMessages); 

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim() && selectedChatId) { // Ensure a chat is selected
      const newMessage: ChatMessage = {
        id: String(Date.now()), 
        sender: 'user',
        content: inputMessage,
        timestamp: new Date(),
      };
      setMessagesState(prevMessages => [...prevMessages, newMessage]);
      setInputMessage('');
      // Update conversation's last message and timestamp
      setConversations(prevConvos => prevConvos.map(convo => 
        convo.id === selectedChatId 
          ? { ...convo, lastMessage: inputMessage, timestamp: new Date() } 
          : convo
      ));
    }
  }, [inputMessage, selectedChatId, setMessagesState, setInputMessage, setConversations]);

  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  const handleNewChat = useCallback(() => {
    const newConversationId = String(Date.now());
    const newConversation: ChatConversation = {
      id: newConversationId,
      title: "New Chat", // Or prompt user for title
      timestamp: new Date(),
      lastMessage: ""
    };
    setConversations(prevConvos => [newConversation, ...prevConvos]);
    setSelectedChatId(newConversationId);
    setMessagesState([]); // Clear messages for new chat
    console.log('New chat created:', newConversationId);
  }, [setConversations, setSelectedChatId, setMessagesState]);

  const togglePinConversation = useCallback((conversationId: string) => {
    setConversations(prevConvos =>
      prevConvos.map(convo =>
        convo.id === conversationId ? { ...convo, isPinned: !convo.isPinned } : convo
      ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.timestamp.getTime() - a.timestamp.getTime()) // Keep pinned at top, then by time
    );
  }, [setConversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prevConvos => prevConvos.filter(convo => convo.id !== conversationId));
    if (selectedChatId === conversationId) {
      setSelectedChatId(null); 
      setMessagesState([]); // Clear messages if active chat is deleted
    }
  }, [selectedChatId, setConversations, setSelectedChatId, setMessagesState]);

  const exportConversation = useCallback((conversation: ChatConversation) => {
    const messagesToExport = messagesState; // Assuming messagesState holds messages for the selectedChat
                                          // For a more robust solution, you might fetch/filter messages by conversation.id
    let content = `Conversation Title: ${conversation.title}\nTimestamp: ${conversation.timestamp.toISOString()}\nParticipants: ${conversation.participants || 'N/A'}\nTags: ${conversation.tags?.join(', ') || 'N/A'}\n\nMessages:\n`;
    
    messagesToExport.forEach(msg => {
      content += `------------------------------------\n`;
      content += `Sender: ${msg.sender}\n`;
      content += `Timestamp: ${msg.timestamp.toISOString()}\n`;
      content += `Content: ${msg.content}\n`;
      if (msg.attachments && msg.attachments.length > 0) {
        content += `Attachments: ${msg.attachments.map(att => att.name).join(', ')}\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conversation-${conversation.id}-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    console.log('Exporting conversation:', conversation.id);
  }, [messagesState]); // Added messagesState dependency


  const secondaryActions = useMemo(() => [
    {
      label: 'Add to project',
      onClick: () => console.log('Add to project'),
      variant: 'secondary' as const
    },
    {
      label: 'Export Current Chat',
      onClick: () => {
        const currentConvo = conversations.find(c => c.id === selectedChat);
        if (currentConvo) {
          exportConversation(currentConvo);
        }
      },
      variant: 'secondary' as const,
      disabled: !selectedChat // Disable if no chat is selected
    }
  ], [selectedChat, conversations, exportConversation]); 

  useEffect(() => {
    const currentConversation = conversations.find(c => c.id === selectedChat);
    const newHeaderProps = {
      title: currentConversation ? currentConversation.title : "Chat",
      breadcrumb: currentConversation ? [{label: "Chat", onClick: () => setSelectedChat(null)}, {label: currentConversation.title}] : [{label: "Chat"}],
      primaryAction: {
        label: 'New chat',
        onClick: handleNewChat,
        icon: <Plus size={16} />
      },
      secondaryActions: secondaryActions 
    };
    if (JSON.stringify(headerProps) !== JSON.stringify(newHeaderProps)) {
        setHeaderProps(newHeaderProps);
    }
    // Not clearing header props on unmount to maintain consistency when navigating between sub-views if any.
    // clearHeaderProps might be called by the parent layout or App component when navigating away from /chat route.
  }, [setHeaderProps, handleNewChat, secondaryActions, headerProps, selectedChat, conversations]);

  const filteredConversations = useMemo(() => {
    return conversations
      .filter(convo => {
        const matchesSearchQuery = convo.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (filterCriteria.pinnedStatus === 'pinned') {
          return matchesSearchQuery && convo.isPinned;
        }
        if (filterCriteria.pinnedStatus === 'unpinned') {
          return matchesSearchQuery && !convo.isPinned;
        }
        return matchesSearchQuery;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.timestamp.getTime() - a.timestamp.getTime());
  }, [conversations, searchQuery, filterCriteria]);

  return (
    <div className="w-full h-full flex gap-6">
      {/* Left Panel - Conversations List */}
      <div className={`h-full transition-all duration-300 ease-in-out ${
        isConversationSidebarCollapsed ? 'w-16' : 'w-1/3'
      }`}>
        <Card className="h-full flex flex-col" padding="none">
          {/* Card Header: Title, New Chat, Toggle */}
          <div className={`p-4 border-b border-border-subtle flex items-center ${isConversationSidebarCollapsed ? 'justify-center' : 'justify-between'} flex-shrink-0`}>
            {!isConversationSidebarCollapsed && (
              <h3 className="text-lg font-semibold text-text-primary truncate">Conversations</h3>
            )}
            {!isConversationSidebarCollapsed && (
              <div className="flex items-center gap-1"> {/* Group buttons for expanded state */}
                <button
                  onClick={handleNewChat}
                  title="New chat"
                  className="p-2 hover:bg-bg-hover rounded-md transition-colors text-text-secondary hover:text-text-primary"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => setIsConversationSidebarCollapsed(true)}
                  className="p-2 hover:bg-bg-hover rounded-md transition-colors text-text-secondary hover:text-text-primary"
                  title="Collapse conversations"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>
            )}
            {isConversationSidebarCollapsed && (
              <button
                onClick={() => setIsConversationSidebarCollapsed(false)}
                className="p-2 hover:bg-bg-hover rounded-md transition-colors text-text-secondary hover:text-text-primary"
                title="Expand conversations"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
          </div>

          {!isConversationSidebarCollapsed && (
            <>
              {/* Search and Filter Section */}
              <div className="p-4 space-y-4 border-b border-border-subtle flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 py-2 pr-3 pl-10 bg-bg-surface border border-border-subtle rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-md transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                {isFilterOpen && (
                  <div className="p-3 border-t border-border-subtle space-y-2">
                    <p className="text-xs font-medium text-text-secondary">Filter by Pinned Status:</p>
                    {(['all', 'pinned', 'unpinned'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterCriteria({ pinnedStatus: status });
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${
                          filterCriteria.pinnedStatus === status
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-bg-hover'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation List Section */}
              <div className="flex-grow overflow-y-auto min-h-0"> {/* Scrollable area */}
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary mt-4 mb-3 px-4">
                  <Clock className="w-4 h-4" />
                  All Conversations
                </div>
                <div className="space-y-1.5 px-4 pb-4">
                  {filteredConversations.length === 0 && (
                    <div className="text-center text-text-secondary py-4">
                      No conversations found.
                    </div>
                  )}
                  {filteredConversations.map(conversation => {
                    const [isHovered, setIsHovered] = useState(false);
                    const isCurrentlySelected = selectedChat === conversation.id;
                    return (
                      <div
                        key={conversation.id}
                        className={`p-2.5 rounded-md cursor-pointer transition-colors duration-150 ease-in-out relative group ${
                          isCurrentlySelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-bg-hover active:bg-bg-active'
                        }`}
                        onClick={() => setSelectedChat(conversation.id)}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className={`text-sm font-medium truncate pr-2 ${isCurrentlySelected ? 'text-primary-foreground' : 'text-text-primary'}`}>
                            {conversation.title}
                          </h4>
                          {conversation.isPinned && (
                             <Pin className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrentlySelected ? 'text-primary-foreground/80' : 'text-primary'}`} />
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className={`text-xs mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap ${isCurrentlySelected ? 'text-primary-foreground/90' : 'text-text-secondary'}`}>
                            {conversation.lastMessage}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1 flex-wrap">
                            {conversation.tags?.map(tag => (
                              <span key={tag} className={`text-xs px-1.5 py-0.5 rounded ${isCurrentlySelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-bg-surface text-text-secondary'}`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${isCurrentlySelected ? 'text-primary-foreground/80' : 'text-text-secondary'}`}>
                            <span>{formatTimestamp(conversation.timestamp)}</span>
                            {conversation.participants != null && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {conversation.participants}
                              </div>
                            )}
                          </div>
                        </div>
                        {isHovered && !isCurrentlySelected && (
                          <div className="absolute top-1 right-1 flex gap-0.5 p-0.5 bg-bg-elevated rounded-md shadow-md border border-border-subtle z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); togglePinConversation(conversation.id); }} 
                              title={conversation.isPinned ? "Unpin conversation" : "Pin conversation"}
                              className="p-1 hover:bg-bg-hover rounded-md transition-colors"
                            >
                              <Pin className={`w-3.5 h-3.5 ${conversation.isPinned ? 'text-primary fill-primary' : 'text-text-secondary'}`} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); exportConversation(conversation); }} 
                              title="Export conversation"
                              className="p-1 hover:bg-bg-hover rounded-md transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); }} 
                              title="Delete conversation"
                              className="p-1 hover:bg-bg-hover rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col max-h-full min-w-0" padding="none"> {/* Removed transition-all duration-300 ease-in-out */}
        {/* Chat Header */}
        <div className="p-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary min-w-0">
              {headerProps?.breadcrumb?.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>&gt;</span>}
                  <button 
                    onClick={item.onClick} 
                    className={`truncate hover:underline ${index === (headerProps.breadcrumb?.length ?? 0) -1 ? 'text-text-primary font-medium' : ''}`}
                    disabled={!item.onClick}
                  >
                    {item.label}
                  </button>
                </React.Fragment>
              )) || <span className="text-text-primary font-medium">Chat</span>}
            </div>
            <div className="flex items-center gap-4">
              <select className="bg-bg-surface border border-border-subtle rounded-md py-2 px-3 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Claude 3.5 Sonnet</option>
                <option>GPT-4</option>
                <option>Llama 2</option>
              </select>
              <div className="flex items-center gap-1 text-sm text-success">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                Ready
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                  className="p-2 hover:bg-bg-surface rounded-md transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                </button>
                {isMoreOptionsOpen && (
                  <Card className="absolute top-full right-0 mt-2 w-64 z-20 p-2 shadow-xl border border-border-subtle">
                    <ul className="space-y-1">
                      {[ 
                        { label: 'Chat settings', action: () => console.log('Open chat settings') },
                        { label: 'Model information', action: () => console.log('Show model info') },
                        { label: 'Clear messages', action: () => console.log('Clear messages') },
                        { label: 'Manage context/prompt', action: () => console.log('Manage context') },
                        { label: 'Export chat', action: () => {
                            const currentConvo = conversations.find(c => c.id === selectedChat);
                            if (currentConvo) exportConversation(currentConvo);
                            setIsMoreOptionsOpen(false); // Close dropdown
                          }
                        }
                      ].map(item => (
                        <li key={item.label}>
                          <button
                            onClick={() => { item.action(); setIsMoreOptionsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover rounded-md transition-colors"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {selectedChat ? messagesState.map(message => { 
            return (
            <div 
              key={message.id} 
              className={`flex gap-3 relative group ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-bg-elevated text-text-primary'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={`max-w-[70%] flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-xs text-text-secondary mb-1 ${message.sender === 'user' ? 'mr-2' : 'ml-2'}`}>
                  {message.sender === 'user' ? 'You' : 'LibreOllama Assistant'} <span className="text-xs">· {formatTimestamp(message.timestamp)}</span>
                </div>
                <div className={`p-3 rounded-lg text-sm relative group/bubble ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-bg-secondary text-text-primary rounded-bl-none'
                }`}>
                  {message.content.includes('```') ? (
                    <div>
                      {message.content.split('```').map((part, index) => {
                        if (index % 2 === 1) {
                          const lines = part.split('\n');
                          const language = lines[0];
                          const code = lines.slice(1).join('\n');
                          return (
                            <pre key={index} className="bg-bg-surface border border-border-subtle rounded-md p-3 my-2 overflow-x-auto text-sm relative group/codeblock">
                              <div className="flex justify-between items-center mb-2 text-xs text-text-secondary">
                                <span>{language || 'code'}</span>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(code)}
                                  title="Copy code"
                                  className="flex items-center gap-1 px-2 py-1 hover:bg-bg-tertiary rounded transition-colors opacity-0 group-hover/codeblock:opacity-100"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <code>{code}</code>
                            </pre>
                          );
                        }
                        return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }}></span>;
                      })}
                    </div>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }}></span>
                  )}
                  {message.attachments && message.attachments.map(att => (
                    <div key={att.name} className={`mt-2 p-2 rounded-md flex items-center text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary-darker border border-primary-focus text-primary-foreground' 
                        : 'bg-bg-tertiary border border-border-subtle text-text-primary'
                    }`}>
                      <Paperclip className="w-3 h-3 mr-2 text-text-secondary flex-shrink-0" />
                      <div className="min-w-0"> 
                        <span className="font-medium block truncate">{att.name}</span>
                        <span className="text-xs text-text-secondary">{att.type.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => navigator.clipboard.writeText(message.content)}
                    title="Copy message content"
                    className="absolute top-0.5 right-0.5 p-1 bg-inherit rounded-full opacity-0 group-hover/bubble:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <Copy className={`w-3 h-3 ${message.sender === 'user' ? 'text-primary-foreground/80' : 'text-text-secondary' } hover:text-primary`} />
                  </button>
                </div>
              </div>
            </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No chat selected</p>
              <p className="text-sm">Select a conversation from the list or <button onClick={handleNewChat} className="text-primary hover:underline font-medium">start a new one</button>.</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border-subtle flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex gap-1">
              <button className="p-2.5 hover:bg-bg-surface rounded-md transition-colors text-text-secondary hover:text-primary" title="Attach files">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-2.5 hover:bg-bg-surface rounded-md transition-colors text-text-secondary hover:text-primary" title="Add images">
                <Image className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 relative">
              <textarea
                className="w-full min-h-[44px] max-h-32 py-3 px-4 bg-bg-surface border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={selectedChat ? "Ask about design, code, or anything else... (Ctrl+Enter to send)" : "Select or start a new conversation to begin"}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault(); // Prevent newline in textarea
                    handleSendMessage();
                  }
                }}
                disabled={!selectedChat} 
              />
            </div>
            <button
              className={`p-3 rounded-lg transition-colors flex items-center justify-center aspect-square ${
                inputMessage.trim() && selectedChat
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-bg-surface text-text-secondary cursor-not-allowed'
              }`}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !selectedChat}
              title="Send message (Ctrl+Enter or Cmd+Enter)"
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
