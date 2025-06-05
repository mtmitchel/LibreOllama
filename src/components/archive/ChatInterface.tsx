import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/use-chat';
import { useOllama } from '../hooks/use-ollama';
import { StreamingChatBubble } from './StreamingChatBubble';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Loader2, Send, Plus, MessageSquare, Square, Zap, Pin, PinOff, Download, MoreVertical, FileText } from 'lucide-react';
import type { ChatSession, ChatMessage } from '../lib/types';
import { invoke } from '@tauri-apps/api/core';

export function ChatInterface() {
  const {
    chatSessions,
    activeChatSession,
    loading,
    error,
    createChatSession,
    setActiveChatSession,
    sendMessage,
    deleteChatSession,
    toggleChatSessionPin
  } = useChat();

  const {
    models,
    startStream,
    cancelStream,
    isStreaming,
    health
  } = useOllama();

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [streamingContent, setStreamingContent] = useState<{[key: string]: string}>({});
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatSession?.messages]);

  // Set default model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

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
        const streamingMessageId = `streaming-${Date.now()}`;
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
          await sendMessage(fullResponse, 'assistant');
          
        } catch (streamError) {
          console.error('Streaming failed, falling back to regular message:', streamError);
          // Fallback to regular message sending
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
        // Use regular message sending
        await sendMessage(content);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCancelStream = () => {
    if (isStreaming && currentStreamingMessageRef.current) {
      cancelStream();
      setStreamingContent(prev => {
        const newState = { ...prev };
        if (currentStreamingMessageRef.current) {
          delete newState[currentStreamingMessageRef.current];
        }
        return newState;
      });
      currentStreamingMessageRef.current = null;
    }
  };

  const handleCreateNewChat = async () => {
    const title = `Chat ${new Date().toLocaleTimeString()}`;
    await createChatSession(title);
  };

  const handleSelectSession = async (sessionId: string) => {
    await setActiveChatSession(sessionId);
  };

  const handlePinChat = async (sessionId: string) => {
    await toggleChatSessionPin(sessionId);
  };

  const handleExportChat = async (sessionId: string, format: 'json' | 'markdown' = 'json') => {
    try {
      if (format === 'markdown') {
        const markdown = await invoke<string>('export_chat_session_markdown', { sessionId });
        // Create and download the file
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${sessionId}-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const chatData = await invoke<string>('export_chat_session', { sessionId });
        // Create and download the file
        const blob = new Blob([chatData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${sessionId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export chat:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading chat sessions...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 border-r border-border bg-muted/10">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chats</h2>
            <Button size="sm" onClick={handleCreateNewChat}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-2 space-y-2">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            {chatSessions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chat sessions yet</p>
                <p className="text-xs">Create your first chat to get started</p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    activeChatSession?.id === session.id ? 'bg-accent border-primary' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div
                        className="min-w-0 flex-1"
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <h3 className="font-medium text-sm truncate">{session.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.messages.length} messages
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {session.pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePinChat(session.id)}>
                              {session.pinned ? (
                                <>
                                  <PinOff className="h-4 w-4 mr-2" />
                                  Unpin Chat
                                </>
                              ) : (
                                <>
                                  <Pin className="h-4 w-4 mr-2" />
                                  Pin Chat
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportChat(session.id, 'json')}>
                              <Download className="h-4 w-4 mr-2" />
                              Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportChat(session.id, 'markdown')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export as Markdown
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">{activeChatSession.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {activeChatSession.messages.length} messages
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Model Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Model:</span>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Streaming Toggle */}
                  <Button
                    variant={useStreaming ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseStreaming(!useStreaming)}
                    disabled={isStreaming}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    {useStreaming ? "Streaming" : "Standard"}
                  </Button>

                  {/* Cancel Stream Button */}
                  {isStreaming && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelStream}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}

                  {/* Chat Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4 mr-1" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePinChat(activeChatSession.id)}>
                        {activeChatSession.pinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Unpin Chat
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin Chat
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExportChat(activeChatSession.id, 'json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportChat(activeChatSession.id, 'markdown')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteChatSession(activeChatSession.id)}
                        className="text-destructive"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {activeChatSession.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {activeChatSession.messages.map((message: ChatMessage) => (
                      <StreamingChatBubble
                        key={message.id}
                        message={message}
                      />
                    ))}
                    
                    {/* Render streaming messages */}
                    {Object.entries(streamingContent).map(([streamId, content]) => (
                      <StreamingChatBubble
                        key={streamId}
                        message={{
                          id: streamId,
                          role: 'assistant',
                          content: '',
                          timestamp: new Date().toISOString()
                        }}
                        isStreaming={true}
                        streamContent={content}
                      />
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!messageInput.trim() || sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Welcome to LibreOllama</h2>
              <p className="text-muted-foreground mb-4">
                Select a chat from the sidebar or create a new one to get started
              </p>
              <Button onClick={handleCreateNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}