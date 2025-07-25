import React, { useEffect, useRef, useState, useMemo, useCallback, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { 
  Button, 
  Card, 
  Heading, 
  Text,
  Badge
} from '../ui';
import { MarkdownRenderer } from './MarkdownRenderer';
import { 
  Copy, 
  RefreshCw, 
  ArrowLeftRight, 
  X, 
  Loader2, 
  Edit3,
  Check,
  Languages,
  Sparkles,
  FileText,
  Settings,
  ChevronDown,
  MessageSquare,
  List,
  Type,
  Hash,
  Globe,
  Download,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '../../core/lib/utils';
import type { AIAction } from './AIWritingToolsMenu';

interface AIOutputModalProProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  output: string;
  isLoading?: boolean;
  onReplace: (text: string) => void;
  onRegenerate: (options?: any) => void;
  action: AIAction;
  originalText: string;
  usedModel?: string;
  usedProvider?: string;
}

const LANGUAGES = [
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'zh', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { value: 'zh-TW', label: 'Chinese (Traditional)', flag: '🇹🇼' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
];

const ACTION_CONFIG: Record<AIAction, { title: string; icon: React.ReactNode; color: string }> = {
  'rewrite-professional': { title: 'Professional rewrite', icon: <Type />, color: 'text-blue-600' },
  'rewrite-friendly': { title: 'Friendly rewrite', icon: <MessageSquare />, color: 'text-green-600' },
  'rewrite-concise': { title: 'Concise rewrite', icon: <FileText />, color: 'text-purple-600' },
  'rewrite-expanded': { title: 'Expanded rewrite', icon: <List />, color: 'text-indigo-600' },
  'proofread': { title: 'Proofread & grammar', icon: <Check />, color: 'text-red-600' },
  'summarize': { title: 'Summarize', icon: <Hash />, color: 'text-orange-600' },
  'translate': { title: 'Translate', icon: <Globe />, color: 'text-teal-600' },
  'explain': { title: 'Explain', icon: <MessageSquare />, color: 'text-pink-600' },
  'create-list': { title: 'Create list', icon: <List />, color: 'text-cyan-600' },
  'key-points': { title: 'Extract key points', icon: <Hash />, color: 'text-amber-600' },
  'create-task': { title: 'Create task', icon: <Check />, color: 'text-emerald-600' },
  'create-note': { title: 'Create note', icon: <FileText />, color: 'text-violet-600' },
  'ask-ai': { title: 'Ask AI', icon: <Sparkles />, color: 'text-rose-600' },
};

export function AIOutputModalPro({ 
  isOpen, 
  onClose, 
  prompt, 
  output, 
  isLoading = false,
  onReplace,
  onRegenerate,
  action,
  originalText,
  usedModel,
  usedProvider
}: AIOutputModalProProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState(output);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranslatedLanguage, setCurrentTranslatedLanguage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Reset processing state when output changes
  useEffect(() => {
    if (!isLoading) {
      setIsProcessing(false);
    }
  }, [isLoading]);
  
  // Update edited output when output changes
  useEffect(() => {
    setEditedOutput(output);
    // Reset processing state when output changes
    setIsProcessing(false);
  }, [output]);

  // Update current translated language when output changes
  useEffect(() => {
    if (action === 'translate' && output && !isLoading) {
      // When we have output, the current target language is the translated language
      setCurrentTranslatedLanguage(targetLanguage);
    }
  }, [action, output, isLoading, targetLanguage]);

  // Native event listeners for portal outside React root
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape' && !isEditing) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const handleBackdropClick = (e: MouseEvent) => {
      // Only close if clicking directly on backdrop and modal is open
      if (isOpen && backdropRef.current && e.target === backdropRef.current) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Backdrop clicked - closing modal');
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape, true);
    document.addEventListener('mousedown', handleBackdropClick, true);
    
    // Handle body overflow based on modal state
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.removeEventListener('mousedown', handleBackdropClick, true);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isEditing]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    
    try {
      await navigator.clipboard.writeText(isEditing ? editedOutput : output);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    
    onReplace(isEditing ? editedOutput : output);
    onClose();
  };

  // Force close handler for button clicks
  const handleForceClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('FORCE CLOSE MODAL');
    onClose();
  };

  const handleRegenerateWithLanguage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isProcessing || isLoading) return;
    
    // Use setTimeout to ensure state is settled
    setTimeout(() => {
      setIsProcessing(true);
      
      if (action === 'translate') {
        const language = LANGUAGES.find(l => l.value === targetLanguage)?.label || 'Spanish';
        console.log('Regenerating translation for language:', language);
        setCurrentTranslatedLanguage(targetLanguage);
        onRegenerate({ language });
      } else {
        onRegenerate();
      }
    }, 50);
  };

  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    
    const blob = new Blob([isEditing ? editedOutput : output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-${action}-output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const currentText = isEditing ? editedOutput : output;
    const words = currentText.trim().split(/\s+/).length;
    const chars = currentText.length;
    const sentences = currentText.split(/[.!?]+/).filter(s => s.trim()).length;
    
    const originalWords = originalText.trim().split(/\s+/).length;
    const wordDiff = words - originalWords;
    const percentChange = originalWords > 0 ? Math.round((wordDiff / originalWords) * 100) : 0;
    
    return { words, chars, sentences, wordDiff, percentChange };
  }, [output, editedOutput, originalText, isEditing]);

  const actionConfig = ACTION_CONFIG[action] || ACTION_CONFIG['rewrite-professional']; // Fallback to prevent undefined

  // Keep modal mounted but hidden to preserve state
  return createPortal(
    <div
      ref={backdropRef}
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm",
        isOpen ? "animate-in fade-in duration-200" : "opacity-0 pointer-events-none"
      )}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div 
        ref={modalRef}
        className={cn(
          "relative w-full max-w-2xl max-h-[80vh] flex flex-col m-4",
          isOpen ? "animate-in fade-in zoom-in-95 duration-200" : "opacity-0 scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Card className="relative overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md bg-surface-hover", actionConfig?.color || 'text-blue-600')}>
                {actionConfig?.icon && React.isValidElement(actionConfig.icon) 
                  ? React.cloneElement(actionConfig.icon as React.ReactElement, { size: 16 })
                  : <Type size={16} />
                }
              </div>
              <div>
                <Heading level={4} className="text-base">{actionConfig?.title || 'AI Writing'}</Heading>
                {usedModel && usedProvider && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary">
                      <Settings size={12} className="mr-1" />
                      {usedProvider} · {usedModel}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleForceClose}
              onMouseDown={handleForceClose}
              className="hover:bg-hover"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Action-specific options */}
            {action === 'translate' && !isLoading && (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border-subtle">
                <Languages size={18} className="text-tertiary" />
                <Text size="sm" variant="secondary">
                  {currentTranslatedLanguage === targetLanguage ? 'Translated to:' : 'Translate to:'}
                </Text>
                <select
                  value={targetLanguage}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newValue = e.target.value;
                    setTargetLanguage(newValue);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                  }}
                  disabled={isLoading || isProcessing}
                  className="flex-1 px-3 py-1.5 text-sm bg-surface border border-border-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRegenerateWithLanguage}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || isProcessing}
                  className="gap-2"
                >
                  <RefreshCw size={14} className={cn((isLoading || isProcessing) && "animate-spin")} />
                  Retranslate
                </Button>
              </div>
            )}

            {/* Original text reference */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-primary transition-colors">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                Original text ({originalText.length} characters)
              </summary>
              <div className="mt-2 p-3 text-sm text-tertiary bg-surface rounded-md max-h-32 overflow-y-auto">
                {originalText}
              </div>
            </details>

            {/* Output display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text size="sm" weight="semibold" variant="secondary">AI Response</Text>
                {!isLoading && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs text-tertiary">
                      <span>{metrics.words} words</span>
                      <span>·</span>
                      <span>{metrics.chars} chars</span>
                      <span>·</span>
                      <span>{metrics.sentences} sentences</span>
                      {metrics.wordDiff !== 0 && (
                        <>
                          <span>·</span>
                          <span className={cn(
                            "font-medium",
                            metrics.wordDiff > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {metrics.wordDiff > 0 ? '+' : ''}{metrics.wordDiff} words ({metrics.percentChange > 0 ? '+' : ''}{metrics.percentChange}%)
                          </span>
                        </>
                      )}
                    </div>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={isProcessing}
                        className="gap-1 -mr-2"
                      >
                        <Edit3 size={14} />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
                    <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-accent-primary animate-pulse" />
                  </div>
                  <Text variant="secondary" size="sm">Generating AI response...</Text>
                </div>
              ) : isEditing ? (
                <textarea
                  value={editedOutput}
                  onChange={(e) => setEditedOutput(e.target.value)}
                  className="w-full min-h-[200px] p-4 bg-surface rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary resize-y text-sm font-mono"
                  autoFocus
                />
              ) : (
                <div className="bg-surface rounded-lg border border-border-subtle p-4">
                  <MarkdownRenderer content={output} className="text-sm" />
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="border-t border-border-subtle px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || (!output && !editedOutput) || isProcessing}
                  className="gap-2"
                >
                  {copiedFeedback ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isProcessing || isLoading) return;
                    
                    if (action === 'translate') {
                      handleRegenerateWithLanguage(e);
                    } else {
                      setTimeout(() => {
                        setIsProcessing(true);
                        onRegenerate();
                      }, 50);
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || isProcessing}
                  className="gap-2"
                >
                  <RefreshCw size={16} className={cn((isLoading || isProcessing) && "animate-spin")} />
                  Regenerate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || (!output && !editedOutput) || isProcessing}
                  className="gap-2"
                  title="Export as text file"
                >
                  <Download size={16} />
                  Export
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditedOutput(output);
                        setIsEditing(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      Cancel Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="gap-2"
                    >
                      <Check size={16} />
                      Done Editing
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleForceClose}
                  onMouseDown={handleForceClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReplace}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || (!output && !editedOutput) || isProcessing}
                  className="gap-2"
                >
                  <ArrowLeftRight size={16} />
                  Replace Text
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  );
}