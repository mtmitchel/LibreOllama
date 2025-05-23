"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Settings,
  Copy,
  RotateCcw,
  Edit3,
  Info
} from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ChatSession } from '@/lib/types';
import { VALID_MODELS, MODEL_INFO, type ValidModel } from '@/ai/types';
import { getValidModelCompatibility } from '@/ai/model-compatibility';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedChatInterfaceProps {
  session: ChatSession | null;
  onUpdateSession?: (session: ChatSession) => void;
}

export default function EnhancedChatInterface({ session, onUpdateSession }: EnhancedChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ValidModel>('mistral-nemo:latest');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [showSettings, setShowSettings] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  const { sendMessage, updateChatSession } = useChat();
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  useEffect(() => {
    if (session) {
      setNewTitle(session.title);
    }
  }, [session]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session || !session.id || isLoading) {
      if (!session || !session.id) {
        toast({
          title: 'Error',
          description: 'No active chat session. Please select or create a chat first.',
          variant: 'destructive',
        });
      }
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      // Send user message via the hook
      const userMsg = await sendMessage(userMessage, 'user');
      if (!userMsg) {
        throw new Error('Failed to send user message');
      }

      // Call Ollama API for AI response
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userId: getCurrentUserId(),
          sessionId: session.id,
          model: selectedModel,
          systemPrompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      // Get the response as text (no longer streaming)
      const aiResponse = await response.text();

      // Send AI response via the hook
      if (aiResponse.trim()) {
        const aiMsg = await sendMessage(aiResponse.trim(), 'assistant');
        if (!aiMsg) {
          throw new Error('Failed to send AI response message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        toast({
          title: 'Copied',
          description: 'Message copied to clipboard.',
        });
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast({
            title: 'Copied',
            description: 'Message copied to clipboard.',
          });
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast({
            title: 'Copy failed',
            description: 'Unable to copy to clipboard. Please copy manually.',
            variant: 'destructive',
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateResponse = async (messageIndex: number) => {
    if (!session || !session.id || messageIndex === 0) {
      if (!session || !session.id) {
        toast({
          title: 'Error',
          description: 'No active chat session. Please select or create a chat first.',
          variant: 'destructive',
        });
      }
      return;
    }
    
    const userMessage = session.messages[messageIndex - 1];
    if (userMessage.role !== 'user') return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: getCurrentUserId(),
          sessionId: session.id,
          model: selectedModel,
          systemPrompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to regenerate response');
      }

      // Get the response as text (no longer streaming)
      const aiResponse = await response.text();

      if (aiResponse.trim()) {
        const aiMsg = await sendMessage(aiResponse.trim(), 'assistant');
        if (!aiMsg) {
          throw new Error('Failed to send regenerated response');
        }
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to regenerate response.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!session || !newTitle.trim()) return;
    
    const updated = await updateChatSession(session.id, { title: newTitle.trim() });
    if (updated && onUpdateSession) {
      onUpdateSession(updated);
    }
    setEditingTitle(false);
  };

  const formatModelName = (model: ValidModel) => {
    const modelInfo = MODEL_INFO[model];
    if (modelInfo) {
      return modelInfo.displayName;
    }
    
    // Fallback formatting
    const parts = model.split(':');
    const name = parts[0].replace(/([A-Z])/g, ' $1').toLowerCase();
    return name.charAt(0).toUpperCase() + name.slice(1) + (parts[1] ? ` (${parts[1]})` : '');
  };

  const formatMessage = (content: string) => {
    // Simple URL detection and linking
    return content.split(/(\s+https?:\/\/\S+)/g).map((part, index) =>
      /^https?:\/\/\S+$/.test(part.trim()) ? (
        <a key={index} href={part.trim()} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {part.trim()}
        </a>
      ) : (
        part
      )
    );
  };

  const getModelCompatibilityBadge = (model: ValidModel) => {
    const compatibility = getValidModelCompatibility(model);
    
    switch (compatibility) {
      case 'full':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Tool Support</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Limited Tools</Badge>;
      case 'none':
        return <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">No Tools</Badge>;
      default:
        return null;
    }
  };

  if (!session) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
          <p className="text-muted-foreground">Select a chat from the sidebar or create a new one to start messaging</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleUpdateTitle}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <CardTitle className="text-lg truncate">{session.title}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTitle(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as ValidModel)}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VALID_MODELS.map(model => {
                          const modelInfo = MODEL_INFO[model];
                          return (
                            <SelectItem key={model} value={model}>
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span>{formatModelName(model)}</span>
                                {modelInfo?.size && (
                                  <span className="text-xs text-muted-foreground">{modelInfo.size}</span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {getModelCompatibilityBadge(selectedModel)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold">{MODEL_INFO[selectedModel]?.displayName || selectedModel}</p>
                    <p className="text-sm">{MODEL_INFO[selectedModel]?.description || 'No description available'}</p>
                    {MODEL_INFO[selectedModel]?.capabilities && (
                      <div className="mt-1">
                        <span className="text-xs font-medium">Capabilities: </span>
                        <span className="text-xs">{MODEL_INFO[selectedModel].capabilities.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showSettings && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt</label>
              <Input
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt..."
                className="text-sm"
              />
            </div>
          </div>
        )}
        
        {session.tags && session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {session.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {session.messages.map((msg: ChatMessage, index) => (
              <div
                key={msg.id}
                className={`group flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0">
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div
                    className={`rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {formatMessage(msg.content)}
                    </div>
                    
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Message attachment"
                        className="mt-2 max-w-full rounded-md"
                      />
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyMessage(msg.content)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        
                        {msg.role === 'assistant' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRegenerateResponse(index)}
                            className="h-6 w-6 p-0"
                            disabled={isLoading}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  </div>
                  <div className="rounded-lg p-3 bg-secondary text-secondary-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
} 
