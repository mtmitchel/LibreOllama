import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/use-chat';
import { useOllama } from '../../hooks/use-ollama';
import { useAgents } from '../../hooks/use-agents';
import { StreamingChatBubble } from '../StreamingChatBubble';
import { Button } from '../ui/button-v2';
import { Input } from '../ui/input-v2';
import { Card, CardContent, CardHeader } from '../ui/card-v2';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import {
  Search,
  Plus,
  MessageSquare,
  Send,
  Paperclip,
  MoreHorizontal,
  Pin,
  PinOff,
  Edit3,
  Download,
  Trash2,
  FolderPlus,
  Copy,
  Bot,
  User,
  Loader2,
  Hash,
  ChevronDown,
  X,
  Sparkles,
  Clock,
  Settings
} from 'lucide-react';
import type { ChatSession, ChatMessage } from '../../lib/types';

interface AIChatScreenProps {
  className?: string;
}

interface ConversationListItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onPin: (sessionId: string) => void;
  onRename: (sessionId: string, newTitle: string) => void;
  onDelete: (sessionId: string) => void;
  onExport: (sessionId: string) => void;
  onAddToProject: (sessionId: string) => void;
}

interface ChatBubbleProps {
  message: ChatMessage;
  onCopy?: (content: string) => void;
}

// Sample project tags for demonstration
const SAMPLE_PROJECT_TAGS = [
  { id: 'web-dev', name: 'Web Development', color: 'bg-blue-500' },
  { id: 'research', name: 'Research', color: 'bg-green-500' },
  { id: 'design', name: 'Design', color: 'bg-purple-500' },
  { id: 'personal', name: 'Personal', color: 'bg-orange-500' }
];

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  session,
  isActive,
  onSelect,
  onPin,
  onRename,
  onDelete,
  onExport,
  onAddToProject
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title);

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== session.title) {
      onRename(session.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewTitle(session.title);
      setIsRenaming(false);
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-bg-tertiary border border-accent-primary shadow-sm ring-1 ring-accent-primary/20'
          : 'bg-bg-secondary border border-bg-quaternary hover:bg-bg-tertiary hover:border-accent-primary/50'
      } ${session.pinned ? 'ring-2 ring-accent-warning/50 bg-accent-warning/10' : ''}`}
      onClick={() => !isRenaming && onSelect(session.id)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              className="text-sm font-medium h-8 px-2 py-1 bg-bg-secondary border-bg-quaternary text-white"
              autoFocus
              useV2
            />
          ) : (
            <h3 className="font-medium text-sm text-white truncate leading-5">
              {session.title}
            </h3>
          )}
          
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-400 font-medium">
              {session.messages.length} messages
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {new Date(session.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Project tags */}
          {session.tags && session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {session.tags.slice(0, 2).map((tagId) => {
                const tag = SAMPLE_PROJECT_TAGS.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tag.id} variant="secondary" className="text-xs px-2 py-0.5 bg-bg-tertiary text-slate-300 border-bg-quaternary">
                    <Hash className="h-2.5 w-2.5 mr-1" />
                    {tag.name}
                  </Badge>
                ) : null;
              })}
              {session.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-bg-tertiary text-slate-300 border-bg-quaternary">
                  +{session.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {session.pinned && (
            <Pin className="h-3.5 w-3.5 text-accent-warning" />
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-tertiary"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPin(session.id)}>
                {session.pinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(session.id)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddToProject(session.id)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Add to Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(session.id)}
                className="text-accent-error focus:text-accent-error focus:bg-accent-error/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onCopy }) => {
  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard?.writeText(message.content);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div className={`group flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-bg-quaternary flex items-center justify-center">
            <Bot className="h-4 w-4 text-accent-primary" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-accent-primary text-white ml-auto rounded-br-md'
              : 'bg-bg-secondary text-white border border-bg-quaternary rounded-bl-md'
          }`}
        >
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-invert'}`}>
            <StreamingChatBubble message={message} />
          </div>
        </div>
        
        {!isUser && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-bg-tertiary"
              useV2
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
            <User className="h-4 w-4 text-accent-primary" />
          </div>
        </div>
      )}
    </div>
  );
};

export function AIChatScreen({ className = '' }: AIChatScreenProps) {
  const {
    chatSessions,
    activeChatSession,
    loading,
    error,
    createChatSession,
    setActiveChatSession,
    sendMessage,
    deleteChatSession,
    toggleChatSessionPin,
    updateChatSession
  } = useChat();

  const {
    models,
    startStream,
    cancelStream,
    isStreaming,
    health
  } = useOllama();

  const { } = useAgents();

  // Local state
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [streamingContent, setStreamingContent] = useState<{[key: string]: string}>({});
  const [useStreaming, setUseStreaming] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageRef = useRef<string | null>(null);

  // Set default model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatSession?.messages, streamingContent]);

  // Filter conversations based on search
  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort conversations: pinned first, then by updated date
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || isStreaming) return;

    const content = messageInput.trim();
    const modelToUse = selectedModel || models[0]?.name;
    
    if (!modelToUse) {
      console.error('No model selected or available');
      return;
    }

    setMessageInput('');
    setSending(true);

    try {
      if (useStreaming && health?.status === 'healthy') {
        // Add user message first
        await sendMessage(content);
        
        // Create streaming assistant message
        const streamingMessageId = `streaming-${Date.now()}-${modelToUse}`;
        currentStreamingMessageRef.current = streamingMessageId;
        setStreamingContent(prev => ({ ...prev, [streamingMessageId]: '' }));
        
        // Prepare messages for Ollama API
        const messages = activeChatSession?.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })) || [];
        
        // Add the new user message
        messages.push({ role: 'user', content });
        
        try {
          const fullResponse = await startStream(
            messages,
            modelToUse,
            (chunk: string, fullContent: string) => {
              setStreamingContent(prev => ({
                ...prev,
                [streamingMessageId]: fullContent
              }));
            }
          );
          
          // Send the complete response as a regular message
          await sendMessage(`[${modelToUse}] ${fullResponse}`, 'assistant');
          
        } catch (streamError) {
          console.error('Streaming failed, falling back to regular message:', streamError);
          await sendMessage(content);
        } finally {
          setStreamingContent(prev => {
            const newState = { ...prev };
            delete newState[streamingMessageId];
            return newState;
          });
          currentStreamingMessageRef.current = null;
        }
      } else {
        await sendMessage(content);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    createChatSession(`Chat ${new Date().toLocaleTimeString()}`);
  };

  const handleConversationSelect = (sessionId: string) => {
    setActiveChatSession(sessionId);
  };

  const handleConversationPin = (sessionId: string) => {
    toggleChatSessionPin(sessionId);
  };

  const handleConversationRename = (sessionId: string, newTitle: string) => {
    updateChatSession(sessionId, { title: newTitle });
  };

  const handleConversationDelete = (sessionId: string) => {
    deleteChatSession(sessionId);
  };

  const handleConversationExport = (sessionId: string) => {
    // Placeholder for export functionality
    alert(`Export functionality for session ${sessionId} would be implemented here`);
  };

  const handleAddToProject = (sessionId: string) => {
    // Placeholder for project integration
    alert(`Add to project functionality for session ${sessionId} would be implemented here`);
  };

  const handleClearContext = () => {
    // Placeholder for clear context functionality
    alert('Clear context functionality would be implemented here');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard?.writeText(content);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-3 text-neutral-600 font-medium">Loading chat sessions...</span>
      </div>
    );
  }

  return (
    <div className={`h-full flex bg-bg-primary ${className}`}>
      {/* Left Panel - Conversations List */}
      <div className="w-80 border-r border-bg-tertiary bg-bg-secondary flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-bg-tertiary bg-bg-secondary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Conversations</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewChat}
              iconLeft={Plus}
              className="shadow-sm"
              useV2
            >
              New Chat
            </Button>
          </div>
          
          {/* Search */}
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
            className="bg-bg-tertiary border-bg-quaternary"
            useV2
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {error && (
              <div className="p-3 text-sm text-accent-error bg-accent-error/10 border border-accent-error/20 rounded-lg">
                {error}
              </div>
            )}
            
            {sortedSessions.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium mb-1 text-white">No conversations yet</p>
                <p className="text-xs">Start a new chat to get going</p>
              </div>
            ) : (
              sortedSessions.map((session) => (
                <ConversationListItem
                  key={session.id}
                  session={session}
                  isActive={activeChatSession?.id === session.id}
                  onSelect={handleConversationSelect}
                  onPin={handleConversationPin}
                  onRename={handleConversationRename}
                  onDelete={handleConversationDelete}
                  onExport={handleConversationExport}
                  onAddToProject={handleAddToProject}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChatSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-bg-tertiary bg-bg-secondary shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">{activeChatSession.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{activeChatSession.messages.length} messages</span>
                      <span>•</span>
                      <span>{new Date(activeChatSession.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Model Selection */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-300">Model:</span>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-48 bg-bg-tertiary border-bg-quaternary text-white shadow-sm">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-secondary border-bg-quaternary">
                        {models.map((model) => (
                          <SelectItem key={model.name} value={model.name} className="text-white hover:bg-bg-tertiary">
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="tertiary" size="sm" iconLeft={Settings} className="border-bg-quaternary" useV2>
                        Options
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-bg-secondary border-bg-quaternary">
                      <DropdownMenuItem onClick={handleClearContext} className="text-white hover:bg-bg-tertiary">
                        <X className="h-4 w-4 mr-2" />
                        Clear Context
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConversationExport(activeChatSession.id)} className="text-white hover:bg-bg-tertiary">
                        <Download className="h-4 w-4 mr-2" />
                        Export Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-bg-quaternary" />
                      <DropdownMenuItem
                        onClick={() => handleConversationDelete(activeChatSession.id)}
                        className="text-accent-error focus:text-accent-error focus:bg-accent-error/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-bg-primary">
              <div className="p-6 max-w-4xl mx-auto">
                {activeChatSession.messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-12">
                    <div className="w-20 h-20 rounded-2xl bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-10 w-10 text-accent-primary" />
                    </div>
                    <p className="text-lg font-medium mb-2 text-white">No messages yet</p>
                    <p className="text-sm">Start the conversation with {selectedModel || 'AI'}!</p>
                  </div>
                ) : (
                  <>
                    {activeChatSession.messages.map((message: ChatMessage) => (
                      <ChatBubble
                        key={message.id}
                        message={message}
                        onCopy={handleCopyMessage}
                      />
                    ))}
                    
                    {/* Render streaming messages */}
                    {Object.entries(streamingContent).map(([streamId, content]) => (
                      <ChatBubble
                        key={streamId}
                        message={{
                          id: streamId,
                          role: 'assistant',
                          content: content,
                          timestamp: new Date().toISOString()
                        }}
                      />
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-bg-tertiary bg-bg-secondary">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                <div className="flex items-end gap-3">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="icon"
                    className="flex-shrink-0 mb-1 border-bg-quaternary hover:bg-bg-tertiary"
                    useV2
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${selectedModel || 'AI'}...`}
                      disabled={sending}
                      className="bg-bg-tertiary border-bg-quaternary shadow-sm resize-none min-h-[44px]"
                      useV2
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    loading={sending}
                    iconRight={Send}
                    className="flex-shrink-0 mb-1 shadow-sm"
                    useV2
                  >
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-bg-primary">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-3xl bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-12 w-12 text-accent-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-white">Welcome to AI Chat</h2>
              <p className="text-slate-400 mb-6">
                Select a conversation from the sidebar or create a new one to get started with your AI assistant
              </p>
              <Button onClick={handleNewChat} iconLeft={Plus} className="shadow-sm" useV2>
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}