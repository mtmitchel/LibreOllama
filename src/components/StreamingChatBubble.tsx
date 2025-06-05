import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Copy, Share2, Check } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown-utils';
import type { ChatMessage } from '../lib/types';

interface StreamingChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamContent?: string;
  onCopy?: (content: string) => void;
  onShare?: (content: string) => void;
}

export function StreamingChatBubble({ 
  message, 
  isStreaming = false, 
  streamContent,
  onCopy,
  onShare 
}: StreamingChatBubbleProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Handle typewriter effect for streaming content
  useEffect(() => {
    if (isStreaming && streamContent) {
      setShowTypewriter(true);
      setDisplayedContent(streamContent);
    } else if (!isStreaming) {
      setShowTypewriter(false);
      setDisplayedContent(message.content);
    }
  }, [isStreaming, streamContent, message.content]);

  // Handle typewriter animation for completed messages
  useEffect(() => {
    if (!isStreaming && message.role === 'assistant' && !message.isOptimistic) {
      const content = message.content;
      let index = 0;
      setDisplayedContent('');
      setShowTypewriter(true);

      const timer = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
        } else {
          setShowTypewriter(false);
          clearInterval(timer);
        }
      }, 20); // Adjust speed as needed

      return () => clearInterval(timer);
    }
  }, [message.content, message.role, message.isOptimistic, isStreaming]);

  const handleCopy = async () => {
    const contentToCopy = streamContent || displayedContent;
    if (onCopy) {
      onCopy(contentToCopy);
    } else {
      try {
        await navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleShare = async () => {
    const contentToShare = streamContent || displayedContent;
    setShareLoading(true);
    
    try {
      if (onShare) {
        onShare(contentToShare);
      } else if (navigator.share) {
        await navigator.share({
          title: 'LibreOllama Chat Message',
          text: contentToShare,
        });
      } else {
        // Fallback to copy
        await navigator.clipboard.writeText(contentToShare);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to share:', err);
    } finally {
      setShareLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const isUser = message.role === 'user';
  const isOptimistic = message.isOptimistic || isStreaming;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`max-w-[85%] rounded-lg p-4 relative ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted border'
        } ${isOptimistic ? 'opacity-80' : ''} ${
          message.error ? 'border-destructive bg-destructive/5' : ''
        }`}
      >
        {/* Message Content */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="text-sm leading-relaxed">
                {renderMarkdown(displayedContent)}
                {showTypewriter && (
                  <span className="inline-block w-2 h-4 ml-1 bg-current opacity-75 animate-pulse" />
                )}
              </div>
            </div>
          </div>
          
          {/* Loading indicator for optimistic messages */}
          {isOptimistic && (
            <div className="flex-shrink-0">
              <Loader2 className="h-4 w-4 animate-spin opacity-60" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {message.error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            <strong>Error:</strong> {message.error}
          </div>
        )}

        {/* Message Actions */}
        {!isOptimistic && !message.error && displayedContent && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={shareLoading}
                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {shareLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Share2 className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Timestamp and Status */}
            <div className="flex items-center gap-2">
              {isStreaming && (
                <Badge variant="outline" className="text-xs">
                  Streaming...
                </Badge>
              )}
              <span className="text-xs opacity-60">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        )}

        {/* Role indicator for system messages */}
        {message.role === 'system' && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              System
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}