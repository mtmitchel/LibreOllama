import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../hooks/use-chat';
import { useOllama } from '../../hooks/use-ollama';
import { useAgents } from '../../hooks/use-agents';
import { useAutoSave } from '../../hooks/use-auto-save';
import { StreamingChatBubble } from '../StreamingChatBubble';
import { UniversalContextMenu } from '../ui/universal-context-menu';
import { useDraggable } from '../../hooks/use-drag-drop';
import { DragDataFactory } from '../../lib/drag-drop-system';
import { SaveStatusBadge } from '../ui/save-status-indicator';
import EnhancedContentStrategy from '../../lib/content-strategy-enhanced';
import { useFocusUtilities } from '../../lib/focus-utilities';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import {
  Loader2,
  Send,
  Plus,
  MessageSquare,
  Square,
  Zap,
  Split,
  Maximize2,
  Minimize2,
  FileText,
  BarChart3,
  Layers,
  Copy,
  Download,
  Settings,
  Save,
  CheckSquare,
  Bot,
  ChevronDown,
  Paperclip,
  User
} from 'lucide-react';
import type { ChatSession, ChatMessage } from '../../lib/types';
import { ContextualActionsService } from '../../lib/contextual-actions';

interface EnhancedChatInterfaceProps {
  className?: string;
  focusMode?: boolean;
  enableAutoSave?: boolean;
  onSessionSave?: (session: ChatSession) => void;
}

interface ContextVisualization {
  totalTokens: number;
  maxTokens: number;
  segments: Array<{
    id: string;
    type: 'system' | 'conversation' | 'recent';
    tokens: number;
    color: string;
    label: string;
  }>;
}

interface PromptFileText {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  category: string;
}

export function EnhancedChatInterface({
  className = '',
  focusMode = false,
  enableAutoSave = true,
  onSessionSave
}: EnhancedChatInterfaceProps) {
  const {
    chatSessions,
    activeChatSession,
    loading,
    error,
    createChatSession,
    setActiveChatSession,
    sendMessage,
    deleteChatSession
  } = useChat();

  const {
    models,
    startStream,
    cancelStream,
    isStreaming,
    health
  } = useOllama();

  const {
    agents,
    getAgentById
  } = useAgents();

  // Enhanced state management
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [dualViewMode, setDualViewMode] = useState(false);
  const [leftPaneModel, setLeftPaneModel] = useState('');
  const [rightPaneModel, setRightPaneModel] = useState('');
  const [streamingContent, setStreamingContent] = useState<{[key: string]: string}>({});
  const [useStreaming, setUseStreaming] = useState(true);
  const [showFileTexts, setShowFileTexts] = useState(false);
  const [contextVisualization, setContextVisualization] = useState<ContextVisualization | null>(null);
  const [showContextToolbar, setShowContextToolbar] = useState(false);
  const [contextItems, setContextItems] = useState<Array<{
    id: string;
    type: 'note' | 'task';
    title: string;
    content: string;
  }>>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageRef = useRef<string | null>(null);

  // Focus utilities integration for message input
  const focusUtilities = useFocusUtilities({ autoApply: true });

  // Auto-save integration for chat sessions
  const autoSave = useAutoSave<ChatSession>({
    contentType: 'chat',
    contentId: activeChatSession?.id || 'no-session',
    saveHandler: async (sessionData) => {
      if (onSessionSave && activeChatSession) {
        onSessionSave(sessionData);
        return true;
      }
      return false;
    },
    debounceMs: 1000, // Longer debounce for chat to avoid saving too frequently
    enableOptimisticUpdates: true,
    onSaveSuccess: (savedSession) => {
      console.log('Chat session auto-saved:', savedSession.id);
    },
    onSaveError: (error, sessionData) => {
      console.error('Chat auto-save failed:', error, sessionData.id);
    }
  });

  // Trigger auto-save when active session changes
  useEffect(() => {
    if (enableAutoSave && activeChatSession) {
      autoSave.autoSave(activeChatSession);
    }
  }, [activeChatSession, enableAutoSave, autoSave]);

  // Sample prompt templates
  const promptFileTexts: PromptFileText[] = [
    {
      id: '1',
      name: 'Code Review',
      description: 'Review code for best practices and improvements',
      content: 'Please review the following code for:\n- Best practices\n- Performance optimizations\n- Security concerns\n- Readability improvements\n\nCode:\n{{code}}',
      variables: ['code'],
      category: 'Development'
    },
    {
      id: '2',
      name: 'Explain Concept',
      description: 'Explain a complex concept in simple terms',
      content: 'Please explain {{concept}} in simple terms that a {{audience}} would understand. Include:\n- Key principles\n- Real-world examples\n- Common misconceptions',
      variables: ['concept', 'audience'],
      category: 'Education'
    },
    {
      id: '3',
      name: 'Task Breakdown',
      description: 'Break down a complex task into manageable steps',
      content: 'Break down the following task into specific, actionable steps:\n\nTask: {{task}}\n\nFor each step, include:\n- What needs to be done\n- Estimated time\n- Required resources\n- Success criteria',
      variables: ['task'],
      category: 'Planning'
    }
  ];

  // Context visualization calculation
  const calculateContextVisualization = useCallback((session: ChatSession | null): ContextVisualization => {
    if (!session) {
      return {
        totalTokens: 0,
        maxTokens: 4096,
        segments: []
      };
    }

    // Simplified token estimation (4 chars ≈ 1 token)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    let totalTokens = 0;
    const segments = [];

    // System message tokens
    const systemTokens = 50; // Estimated system prompt
    totalTokens += systemTokens;
    segments.push({
      id: 'system',
      type: 'system' as const,
      tokens: systemTokens,
      color: 'bg-blue-500',
      label: 'System'
    });

    // Conversation history tokens
    const conversationTokens = session.messages.reduce((acc, msg) => acc + estimateTokens(msg.content), 0);
    totalTokens += conversationTokens;
    segments.push({
      id: 'conversation',
      type: 'conversation' as const,
      tokens: conversationTokens,
      color: 'bg-green-500',
      label: 'Conversation'
    });

    // Recent context (last 3 messages get priority)
    const recentMessages = session.messages.slice(-3);
    const recentTokens = recentMessages.reduce((acc, msg) => acc + estimateTokens(msg.content), 0);
    segments.push({
      id: 'recent',
      type: 'recent' as const,
      tokens: recentTokens,
      color: 'bg-yellow-500',
      label: 'Recent Focus'
    });

    return {
      totalTokens,
      maxTokens: 4096, // Default context window
      segments
    };
  }, []);

  useEffect(() => {
    if (activeChatSession) {
      setContextVisualization(calculateContextVisualization(activeChatSession));
    }
  }, [activeChatSession, calculateContextVisualization]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatSession?.messages]);

  // Set default models when models are loaded
  useEffect(() => {
    if (models.length > 0) {
      if (!leftPaneModel) setLeftPaneModel(models[0].name);
      if (!rightPaneModel && models.length > 1) {
        setRightPaneModel(models[1].name);
      } else if (!rightPaneModel) {
        setRightPaneModel(models[0].name);
      }
    }
  }, [models, leftPaneModel, rightPaneModel]);

  const handleSendMessage = async (e: React.FormEvent, targetModel?: string) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || isStreaming) return;

    const content = messageInput.trim();
    const modelToUse = targetModel || leftPaneModel || models[0]?.name;
    
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

  const handleDualViewSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || isStreaming) return;

    // Send to both models simultaneously
    const promises = [
      handleSendMessage(e, leftPaneModel),
      handleSendMessage(e, rightPaneModel)
    ];

    await Promise.all(promises);
  };

  const insertFileText = (template: PromptFileText) => {
    let content = template.content;
    
    // Simple variable replacement (in real implementation, would show a form)
    template.variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const value = prompt(`Enter value for ${variable}:`);
      if (value) {
        content = content.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    setMessageInput(content);
    setShowFileTexts(false);
  };

  // AI Response Quick Actions
  const handleSaveAsNote = async (messageContent: string) => {
    try {
      const result = await ContextualActionsService.saveAsNoteWithAutoTitle(messageContent);
      if (result.success) {
        console.log('Note created:', result.data?.createdItems?.[0]);
        // Here you would integrate with your notes system
      }
    } catch (error) {
      console.error('Failed to save as note:', error);
    }
  };

  const handleExtractTasks = async (messageContent: string) => {
    try {
      const result = await ContextualActionsService.extractTasksFromAIResponse(messageContent);
      if (result.success && result.data?.createdItems) {
        console.log('Tasks extracted:', result.data.createdItems);
        // Here you would integrate with your task system
      }
    } catch (error) {
      console.error('Failed to extract tasks:', error);
    }
  };

  // Context attachment functions
  const addNoteToContext = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      type: 'note' as const,
      title: 'Sample Note',
      content: 'This is a sample note added to context'
    };
    setContextItems(prev => [...prev, newNote]);
  };

  const addTaskToContext = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      type: 'task' as const,
      title: 'Sample Task',
      content: 'This is a sample task added to context'
    };
    setContextItems(prev => [...prev, newTask]);
  };

  const removeContextItem = (id: string) => {
    setContextItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle contextual actions from text selection
  const handleContextualAction = async (actionId: string, context: any) => {
    switch (actionId) {
      case 'send-to-chat':
        setMessageInput(context.selectedText);
        break;
      case 'convert-to-task':
        // Integrate with task creation
        console.log('Converting to task:', context.selectedText);
        break;
      case 'expand-with-ai':
        // Send to AI for expansion
        setMessageInput(`Please expand on this: "${context.selectedText}"`);
        break;
      default:
        console.log('Unhandled action:', actionId);
    }
  };

  const ContextVisualizationBar = () => {
    if (!contextVisualization) return null;

    const usagePercentage = (contextVisualization.totalTokens / contextVisualization.maxTokens) * 100;

    return (
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Context Window</span>
          <span className="text-xs text-muted-foreground">
            {contextVisualization.totalTokens} / {contextVisualization.maxTokens} tokens
          </span>
        </div>
        <div className="relative">
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex mt-1 gap-1">
            {contextVisualization.segments.map(segment => (
              <div
                key={segment.id}
                className="flex items-center gap-1 text-xs"
              >
                <div className={`w-2 h-2 rounded-full ${segment.color}`} />
                <span>{segment.label} ({segment.tokens})</span>
              </div>
            ))}
          </div>
        </div>
        {usagePercentage > 80 && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Context window is nearly full. Consider starting a new conversation.
          </div>
        )}
      </div>
    );
  };

  // Enhanced AI Response Bubble with Quick Actions and Drag Support
  const AIResponseBubble = ({ message }: { message: ChatMessage }) => {
    const { ref: dragRef, isDragging } = useDraggable(
      () => DragDataFactory.fromChatMessage(message, 'chat-interface'),
      {
        feedback: { opacity: 0.8, cursor: 'grabbing' },
        onDragStart: () => console.log('Dragging chat message:', message.content.slice(0, 50)),
        onDragEnd: (success) => console.log('Chat message drag ended:', success)
      }
    );

    return (
      <div
        ref={dragRef as any}
        className={`group relative ${isDragging ? 'drag-chat chat-message-dragging' : ''}`}
      >
        <StreamingChatBubble message={message} />
        {message.role === 'assistant' && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSaveAsNote(message.content)}
                className="h-6 w-6 p-0"
                title="Save as Note"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExtractTasks(message.content)}
                className="h-6 w-6 p-0"
                title="Extract Tasks"
              >
                <CheckSquare className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(message.content)}
                className="h-6 w-6 p-0"
                title="Copy"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute top-2 left-2 opacity-75">
            <MessageSquare className="h-3 w-3 text-green-500" />
          </div>
        )}
      </div>
    );
  };

  // Context Toolbar Component
  const ContextToolbar = () => (
    <div className="border-b border-border bg-muted/30 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContextToolbar(!showContextToolbar)}
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Context ({contextItems.length})
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showContextToolbar ? 'rotate-180' : ''}`} />
          </Button>
          
          {showContextToolbar && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={addNoteToContext}>
                <FileText className="h-3 w-3 mr-1" />
                Add Note
              </Button>
              <Button variant="outline" size="sm" onClick={addTaskToContext}>
                <CheckSquare className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
          )}
        </div>

        {/* AI Persona/Agent Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">AI Agent:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                <Bot className="h-3 w-3 mr-1" />
                {activeAgentId ? getAgentById(activeAgentId)?.name || 'Unknown' : 'Default'}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveAgentId(null)}>
                <User className="h-4 w-4 mr-2" />
                Default Assistant
              </DropdownMenuItem>
              {agents.map(agent => (
                <DropdownMenuItem
                  key={agent.id}
                  onClick={() => setActiveAgentId(agent.id)}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {agent.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Context Items Display */}
      {showContextToolbar && contextItems.length > 0 && (
        <div className="mt-2 space-y-1">
          {contextItems.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-background rounded p-2">
              <div className="flex items-center gap-2">
                {item.type === 'note' ? (
                  <FileText className="h-3 w-3 text-blue-500" />
                ) : (
                  <CheckSquare className="h-3 w-3 text-green-500" />
                )}
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.content.slice(0, 50)}...
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeContextItem(item.id)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3 rotate-45" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ChatPane = ({ 
    title, 
    model, 
    onModelChange, 
    messages, 
    isLeft = true 
  }: { 
    title: string; 
    model: string; 
    onModelChange: (model: string) => void; 
    messages: ChatMessage[]; 
    isLeft?: boolean;
  }) => (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{title}</h3>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            messages
              .filter(msg => !dualViewMode || msg.content.includes(`[${model}]`) || msg.role === 'user')
              .map((message: ChatMessage) => (
                <StreamingChatBubble
                  key={message.id}
                  message={message}
                />
              ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading chat sessions...</span>
      </div>
    );
  }

  return (
    <div className={`h-full flex ${className}`}>
      {/* Sidebar - Chat Sessions */}
      {!focusMode && (
        <div className="w-80 border-r border-border bg-muted/10">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Chats</h2>
                {enableAutoSave && activeChatSession && (
                  <SaveStatusBadge
                    status={autoSave.saveStatus}
                    onRetry={autoSave.retry}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDualViewMode(!dualViewMode)}
                  className={dualViewMode ? 'bg-accent' : ''}
                >
                  <Split className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => createChatSession(`Chat ${new Date().toLocaleTimeString()}`)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {EnhancedContentStrategy.getEnhancedButtonText('start-chat')}
                </Button>
              </div>
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
                  <p className="text-sm">{EnhancedContentStrategy.getEncouragingEmptyState('chats').primary}</p>
                  <p className="text-xs">{EnhancedContentStrategy.getEncouragingEmptyState('chats').secondary}</p>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      activeChatSession?.id === session.id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => setActiveChatSession(session.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">{session.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.messages.length} messages
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {session.pinned && (
                          <Badge variant="secondary" className="ml-2">
                            Pinned
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

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
                  {/* Model Selection - Only show in single view mode */}
                  {!dualViewMode && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Model:</span>
                      <Select value={leftPaneModel} onValueChange={setLeftPaneModel}>
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
                  )}

                  {/* FileText Trigger */}
                  <Sheet open={showFileTexts} onOpenChange={setShowFileTexts}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        FileTexts
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Prompt FileTexts</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 space-y-4">
                        {promptFileTexts.map(template => (
                          <Card key={template.id} className="cursor-pointer hover:bg-accent" onClick={() => insertFileText(template)}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{template.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                  <Badge variant="secondary" className="mt-2 text-xs">{template.category}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Dual View Toggle */}
                  <Button
                    variant={dualViewMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDualViewMode(!dualViewMode)}
                  >
                    <Split className="h-4 w-4 mr-1" />
                    {dualViewMode ? "Single" : "Dual"} View
                  </Button>

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
                      onClick={cancelStream}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteChatSession(activeChatSession.id)}
                  >
                    Delete Chat
                  </Button>
                </div>
              </div>
            </div>

            {/* Context Visualization */}
            <ContextVisualizationBar />

            {/* Context Toolbar */}
            <ContextToolbar />

            {/* Messages Area */}
            <div className="flex-1 flex">
              {dualViewMode ? (
                <>
                  <ChatPane
                    title="Model A"
                    model={leftPaneModel}
                    onModelChange={setLeftPaneModel}
                    messages={activeChatSession.messages}
                    isLeft={true}
                  />
                  <Separator orientation="vertical" />
                  <ChatPane
                    title="Model B"
                    model={rightPaneModel}
                    onModelChange={setRightPaneModel}
                    messages={activeChatSession.messages}
                    isLeft={false}
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col">
                  <UniversalContextMenu
                    contentType="chat_session"
                    contentId={activeChatSession.id}
                    onAction={handleContextualAction}
                  >
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
                              <AIResponseBubble
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
                  </UniversalContextMenu>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={dualViewMode ? handleDualViewSend : handleSendMessage} className="max-w-4xl mx-auto">
                <div className="flex space-x-2">
                  <Input
                    ref={focusUtilities.ref as any}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={EnhancedContentStrategy.getPlaceholderText('chat-message')}
                    disabled={sending}
                    className="flex-1 focus-mode-content"
                  />
                  <Button type="submit" disabled={!messageInput.trim() || sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {dualViewMode && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Message will be sent to both {leftPaneModel} and {rightPaneModel}
                  </p>
                )}
              </form>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Enhanced Chat</h2>
              <p className="text-muted-foreground mb-4">
                Select a chat from the sidebar or create a new one to get started
              </p>
              <Button onClick={() => createChatSession(`Chat ${new Date().toLocaleTimeString()}`)}>
                <Plus className="h-4 w-4 mr-2" />
                {EnhancedContentStrategy.getEnhancedButtonText('start-chat')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}