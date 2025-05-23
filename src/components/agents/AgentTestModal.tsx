'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Sparkles, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { runResearchAssistantTest } from '@/app/agents/actions';
import type { ResearchAssistantOutput } from '@/ai/flows/research-assistant-flow';
import { MODEL_COMPATIBILITY, getModelCompatibility } from '@/ai/model-compatibility';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TestMessage {
  id: string;
  sender: 'user' | 'agent' | 'systemError';
  text: string;
  agentResponse?: ResearchAssistantOutput;
  model?: string; // Added to track which model was used
}

interface AgentTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentInstructions?: string;
  startingPrompts?: string[];
  model?: string; // Added model prop
}

// Helper function to render formatted markdown-like text
const FormattedText = ({ text }: { text: string }) => {
  // Process the text to render markdown-like formatting with proper HTML
  const processText = (text: string) => {
    // First convert markdown bold to HTML strong tags
    let processed = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-base font-semibold block my-2">$1</strong>');
    
    // Split by newlines and process line by line
    const lines = processed.split('\n');
    const result = [];
    
    let inList = false;
    let listItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        // If we were in a list and this is an empty line, close the list
        if (inList && listItems.length > 0) {
          result.push(`<ul class="list-disc pl-6 space-y-1 my-2">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        
        // Add paragraph break for empty lines between text
        if (i > 0 && i < lines.length - 1 && lines[i-1].trim() !== '' && lines[i+1].trim() !== '') {
          result.push('<div class="my-2"></div>');
        }
        continue;
      }
      
      // Handle bullet points with various markers (• - * 1. a) etc.)
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('* ') || 
          line.match(/^\d+\./) || line.match(/^[a-zA-Z]\)/)) {
        inList = true;
        
        // Extract the content after the bullet point marker
        let content = '';
        if (line.startsWith('•')) {
          content = line.substring(1).trim();
        } else if (line.startsWith('-')) {
          content = line.substring(1).trim();
        } else if (line.startsWith('* ')) {
          content = line.substring(2).trim();
        } else if (line.match(/^\d+\./)) {
          content = line.replace(/^\d+\.\s*/, '').trim();
        } else if (line.match(/^[a-zA-Z]\)/)) {
          content = line.replace(/^[a-zA-Z]\)\s*/, '').trim();
        }
        
        // Add the list item
        listItems.push(`<li class="text-sm">${content}</li>`);
      } else {
        // If we were in a list and this is not a list item, close the list
        if (inList && listItems.length > 0) {
          result.push(`<ul class="list-disc pl-6 space-y-1 my-2">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        
        // Process non-list content
        // Check if the line is already wrapped in HTML (from previous processing)
        if (!line.startsWith('<')) {
          // Regular text line - wrap in span
          result.push(`<span class="text-sm block">${line}</span>`);
        } else {
          // Already has HTML formatting, just add it
          result.push(line);
        }
      }
    }
    
    // Close any open list at the end of processing
    if (inList && listItems.length > 0) {
      result.push(`<ul class="list-disc pl-6 space-y-1 my-2">${listItems.join('')}</ul>`);
    }
    
    return result.join('');
  };
  
  // Sanitize the text before processing to prevent XSS
  const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const processedText = processText(sanitizedText);
  
  return <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: processedText }} />;
};

/**
 * Helper function to get UI details for a model's compatibility
 */
function getModelCompatibilityUI(modelId: string) {
  const level = getModelCompatibility(modelId);
  
  if (level === 'full') {
    return {
      level,
      icon: '🟢',
      description: 'Full tool compatibility',
      details: 'This model can call tools and properly process their responses.',
      className: 'border-green-500 text-green-700'
    };
  } else if (level === 'partial') {
    return {
      level,
      icon: '🟡',
      description: 'Partial tool compatibility',
      details: 'This model can call tools but may have issues processing responses.',
      className: 'border-yellow-500 text-yellow-700'
    };
  } else if (level === 'none') {
    return {
      level,
      icon: '🔴',
      description: 'No tool compatibility',
      details: 'This model cannot use tools. A fallback model (qwen3:8b) will be used instead.',
      className: 'border-red-500 text-red-700'
    };
  }
  
  // Unknown compatibility
  return {
    level,
    icon: '⚪',
    description: 'Unknown compatibility',
    details: 'This model has not been tested with tools yet.',
    className: 'border-gray-500 text-gray-700'
  };
}

export default function AgentTestModal({
  isOpen,
  onClose,
  agentName,
  agentInstructions,
  startingPrompts = [],
  model = 'ollama/qwen3:8b' // Default model if not provided
}: AgentTestModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Get model compatibility information
  const modelCompat = getModelCompatibilityUI(model);

  // Reset messages when modal opens or agentName changes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 'start-' + Date.now(),
          sender: 'agent',
          text: `Hello! I am ${agentName}. How can I assist you today? (Using Research Assistant Flow)`,
          model
        },
      ]);
      setInput(''); // Clear input when modal opens
    }
  }, [isOpen, agentName, model]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        'div[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (messageToSend?: string) => {
    const currentMessage = messageToSend || input;
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: TestMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: currentMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
    if (!messageToSend) { // Only clear input if it wasn't a starting prompt click
        setInput('');
    }
    setIsLoading(true);

    const formData = new FormData();
    formData.append('query', currentMessage);
    if (agentInstructions) {
      formData.append('agentInstructions', agentInstructions);
    }
    if (model) {
      formData.append('model', model);
    }

    try {
      const result = await runResearchAssistantTest(formData);

      if (result.success && result.data) {
        const agentResponse: TestMessage = {
          id: Date.now().toString() + '-agent',
          sender: 'agent',
          text: result.data.summary,
          agentResponse: result.data,
          model: result.model // Include which model was used
        };
        setMessages((prev) => [...prev, agentResponse]);
      } else {
        const errorMessage: TestMessage = {
          id: Date.now().toString() + '-error',
          sender: 'systemError',
          text: result.error || 'An unknown error occurred.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error: any) {
      const errorMessage: TestMessage = {
        id: Date.now().toString() + '-error',
        sender: 'systemError',
        text: error.message || 'Failed to get response from agent.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartingPromptClick = (promptText: string) => {
    handleSend(promptText); // Send directly
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> Test: {agentName}
          </DialogTitle>
          <DialogDescription>
            Interact with the Research Assistant flow using current agent instructions.
            {model && (
              <div className="mt-1 flex items-center">
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-1.5 ${modelCompat.className}`}
                >
                  <span>{modelCompat.icon}</span> {model}
                </Badge>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] p-3">
                    <div className="font-semibold mb-1">{modelCompat.description}</div>
                    <div className="text-xs">{modelCompat.details}</div>
                    {modelCompat.level === 'none' && (
                      <div className="text-xs mt-1 text-red-600">This test will automatically use qwen3:8b instead.</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.sender === 'agent' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage
                    src={`https://placehold.co/100x100.png?text=${agentName
                      .substring(0, 2)
                      .toUpperCase()}`}
                    alt={agentName}
                    data-ai-hint="agent logo"
                  />
                  <AvatarFallback>{agentName.substring(0, 1)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`p-3 rounded-lg max-w-[85%] text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.sender === 'systemError'
                    ? 'bg-destructive/20 text-destructive border border-destructive/50'
                    : 'bg-muted'
                }`}
              >
                {msg.sender === 'agent' ? (
                  <FormattedText text={msg.text} />
                ) : (
                  msg.text
                )}
                {msg.model && msg.sender === 'agent' && (
                  <div className="text-xs mt-2 opacity-70 flex items-center gap-1">
                    <span>{getModelCompatibilityUI(msg.model).icon}</span>
                    {msg.model}
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <Avatar className="h-8 w-8 border">
                  <User className="m-auto h-5 w-5 text-muted-foreground" />
                </Avatar>
              )}
            </div>
          ))}
        </ScrollArea>

        {startingPrompts && startingPrompts.length > 0 && (
          <div className="p-4 border-t flex flex-wrap gap-2">
            {startingPrompts.map((prompt, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                size="sm"
                className="text-xs"
                onClick={() => handleStartingPromptClick(prompt)}
                disabled={isLoading}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {prompt.length > 25 ? prompt.substring(0, 22) + '...' : prompt}
              </Button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t mt-auto"
        >
          <div className="flex items-center gap-2">
            <Input
              name="query"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              disabled={isLoading}
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        <DialogFooter className="p-4 border-t sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close test
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
