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
  onCopy?: () => void;
  onInsert?: () => void;
  onRegenerate?: (options?: any) => void;
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
  onCopy,
  onInsert,
  onRegenerate,
  action,
  originalText,
  usedModel,
  usedProvider
}: AIOutputModalProProps) {
  console.log('AIOutputModalPro render, isOpen:', isOpen, 'action:', action, 'isLoading:', isLoading);
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
  const [askAIQuestion, setAskAIQuestion] = useState('');
  
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
      if (onCopy) {
        // Use custom copy handler if provided
        onCopy();
      } else {
        // Default copy behavior
        await navigator.clipboard.writeText(isEditing ? editedOutput : output);
      }
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
        onRegenerate && onRegenerate({ language });
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
        "fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md",
        isOpen ? "animate-in fade-in duration-300" : "opacity-0 pointer-events-none"
      )}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div 
        ref={modalRef}
        className={cn(
          "relative w-full max-w-3xl max-h-[85vh] flex flex-col m-4",
          isOpen ? "animate-in fade-in slide-in-from-bottom-5 duration-300" : "opacity-0 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Card className="relative overflow-hidden flex flex-col h-full shadow-2xl bg-surface/95 backdrop-blur-xl border border-border-subtle">
          {/* Header */}
          <div className="bg-gradient-to-r from-surface to-surface-hover/50 border-b border-border-subtle">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm shadow-sm",
                  actionConfig?.color || 'text-blue-600'
                )}>
                  {actionConfig?.icon && React.isValidElement(actionConfig.icon) 
                    ? React.cloneElement(actionConfig.icon as React.ReactElement, { size: 20 })
                    : <Type size={20} />
                  }
                </div>
                <div>
                  <Heading level={3} className="text-lg font-semibold">{actionConfig?.title || 'AI Writing'}</Heading>
                  {usedModel && usedProvider && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles size={10} className="mr-1" />
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
                className="hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Action-specific options */}
            {action === 'translate' && (
              <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Languages size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <Text size="sm" weight="medium" className="mb-1">
                      {output && currentTranslatedLanguage === targetLanguage 
                        ? 'Translated to' 
                        : 'Select target language'}
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
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.flag} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant={output ? "secondary" : "primary"}
                    onClick={handleRegenerateWithLanguage}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isLoading || isProcessing}
                    className="gap-2 whitespace-nowrap"
                  >
                    <RefreshCw size={14} className={cn((isLoading || isProcessing) && "animate-spin")} />
                    {output ? 'Retranslate' : 'Translate'}
                  </Button>
                </div>
              </div>
            )}

            {/* Ask AI input */}
            {(action === 'ask-ai' || action === 'ask-custom') && (
              <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <Text size="sm" weight="medium" className="mb-2">
                      What would you like to ask about this text?
                    </Text>
                    <input
                      type="text"
                      value={askAIQuestion}
                      onChange={(e) => setAskAIQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && askAIQuestion.trim() && !isProcessing) {
                          e.preventDefault();
                          const question = askAIQuestion.trim();
                          setIsProcessing(true);
                          onRegenerate && onRegenerate({ question });
                        }
                      }}
                      placeholder="Enter your question..."
                      disabled={isLoading || isProcessing}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      autoFocus
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={output ? "secondary" : "primary"}
                    onClick={() => {
                      if (askAIQuestion.trim() && !isProcessing) {
                        const question = askAIQuestion.trim();
                        setIsProcessing(true);
                        onRegenerate && onRegenerate({ question });
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isLoading || isProcessing || !askAIQuestion.trim()}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Sparkles size={14} className={cn(isProcessing && "animate-pulse")} />
                    {output ? 'Ask Again' : 'Ask'}
                  </Button>
                </div>
              </div>
            )}

            {/* Original text reference */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-hover">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                <span className="font-medium">Original text</span>
                <span className="text-xs text-tertiary">({originalText.length} characters)</span>
              </summary>
              <div className="mt-2 p-4 text-sm text-secondary bg-surface-hover/50 rounded-lg border border-border-subtle max-h-32 overflow-y-auto font-mono">
                {originalText}
              </div>
            </details>

            {/* Output display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-primary" />
                  <Text size="sm" weight="semibold">AI Response</Text>
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-hover/50 rounded-full text-xs">
                      <span className="text-secondary">{metrics.words} words</span>
                      <span className="text-tertiary">•</span>
                      <span className="text-secondary">{metrics.chars} chars</span>
                      {metrics.wordDiff !== 0 && (
                        <>
                          <span className="text-tertiary">•</span>
                          <span className={cn(
                            "font-medium",
                            metrics.wordDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {metrics.wordDiff > 0 ? '+' : ''}{metrics.wordDiff} ({metrics.percentChange > 0 ? '+' : ''}{metrics.percentChange}%)
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
                        className="gap-1.5 hover:bg-surface-hover"
                      >
                        <Edit3 size={14} />
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
                    <Loader2 className="h-10 w-10 animate-spin text-accent-primary relative z-10" />
                    <Sparkles className="h-5 w-5 absolute -top-2 -right-2 text-accent-primary animate-pulse" />
                  </div>
                  <div className="text-center">
                    <Text variant="secondary" size="sm" className="animate-pulse">
                      Generating AI response...
                    </Text>
                    <Text variant="tertiary" size="xs" className="mt-1">
                      Using {action === 'translate' ? 'translation model' : 'writing assistant'}
                    </Text>
                  </div>
                </div>
              ) : isEditing ? (
                <textarea
                  value={editedOutput}
                  onChange={(e) => setEditedOutput(e.target.value)}
                  className="w-full min-h-[250px] p-4 bg-surface border-2 border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary resize-y text-sm font-mono transition-all"
                  autoFocus
                  placeholder="Edit the AI response..."
                />
              ) : output ? (
                <div className="bg-gradient-to-br from-surface to-surface-hover/30 rounded-lg border border-border-subtle p-6 shadow-inner">
                  <MarkdownRenderer content={output} className="text-sm leading-relaxed" />
                </div>
              ) : action === 'translate' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                    <Languages size={32} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <Text variant="secondary">Select a language and click "Translate" to begin</Text>
                </div>
              ) : (action === 'ask-ai' || action === 'ask-custom') && !output ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                    <MessageSquare size={32} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <Text variant="secondary">Enter your question above to get AI insights</Text>
                </div>
              ) : null}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="bg-gradient-to-t from-surface-hover/50 to-surface border-t border-border-subtle px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || (!output && !editedOutput) || isProcessing}
                  className="gap-2 hover:bg-surface-hover transition-all"
                >
                  {copiedFeedback ? (
                    <>
                      <Check size={16} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
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
                  disabled={isLoading || isProcessing || (action === 'translate' && !output)}
                  className="gap-2 hover:bg-surface-hover transition-all"
                >
                  <RefreshCw size={16} className={cn((isLoading || isProcessing) && "animate-spin")} />
                  Regenerate
                </Button>
                <div className="h-6 w-px bg-border-subtle" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || (!output && !editedOutput) || isProcessing}
                  className="gap-2 hover:bg-surface-hover transition-all"
                  title="Export as text file"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
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
                {onInsert && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onInsert) {
                        onInsert();
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isLoading || (!output && !editedOutput) || isProcessing}
                    className="gap-2"
                  >
                    <Download size={16} />
                    Insert
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReplace}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={isLoading || (!output && !editedOutput) || isProcessing}
                  className="gap-2"
                >
                  <ArrowLeftRight size={16} />
                  Replace
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