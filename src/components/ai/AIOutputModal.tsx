import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Card, Heading } from '../ui';
import { Copy, RefreshCw, ArrowLeftRight, X, Loader2 } from 'lucide-react';
import { cn } from '../../core/lib/utils';

interface AIOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  output: string;
  isLoading?: boolean;
  onReplace: (text: string) => void;
  onRegenerate: () => void;
}

function AIOutputModalComponent({ 
  isOpen, 
  onClose, 
  prompt, 
  output, 
  isLoading = false,
  onReplace,
  onRegenerate 
}: AIOutputModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReplace = () => {
    onReplace(output);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <Card className="relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
              <Heading level={3} className="text-lg">AI Writing Assistant</Heading>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="hover:bg-hover"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Prompt display */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-secondary">Your request:</p>
                <p className="text-sm text-tertiary bg-surface rounded-md p-3">
                  {prompt}
                </p>
              </div>

              {/* Output display */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-secondary">AI response:</p>
                <div className="relative">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
                      <span className="ml-2 text-sm text-secondary">Generating response...</span>
                    </div>
                  ) : (
                    <div className="bg-surface rounded-md p-4 min-h-[120px]">
                      <pre className="text-sm whitespace-pre-wrap font-sans">{output}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={isLoading || !output}
                  className="gap-2"
                >
                  <Copy size={16} />
                  {copiedFeedback ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
                  Regenerate
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReplace}
                  disabled={isLoading || !output}
                  className="gap-2"
                >
                  <ArrowLeftRight size={16} />
                  Replace Text
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>,
    document.body
  );
}

export const AIOutputModal = memo(AIOutputModalComponent);