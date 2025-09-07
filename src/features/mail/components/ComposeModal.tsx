import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Maximize2, 
  Minimize2,
  Send, 
  Paperclip, 
  Timer,
  Save,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Reply,
  Forward,
  Users,
  Trash2
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { blocksToHtml, blocksToText } from '../../notes/utils/blocksToHtml';
import ComposeEditor from './ComposeEditor';
import { EmailAutocomplete } from './EmailAutocomplete';
import { useMailStore } from '../stores/mailStore';
import { useContactsStore } from '../stores/contactsStore';
import { 
  GmailComposeService, 
  ComposeRequest, 
  EmailAddress as ComposeEmailAddress,
  MessageImportance,
  gmailComposeUtils
} from '../services/gmailComposeService';
import { 
  handleGmailError, 
  GmailError, 
  ErrorContext 
} from '../services/gmailErrorHandler';
import '../styles/EmailAutocomplete.css';

interface ComposeModalProps {
  replyToMessage?: {
    id: string;
    threadId: string;
    subject: string;
    from: ComposeEmailAddress;
    to: ComposeEmailAddress[];
    cc?: ComposeEmailAddress[];
    body?: string;
    date: string;
  };
  replyType?: 'reply' | 'reply_all' | 'forward';
  scheduledTime?: string;
}

function ComposeModal({ 
  replyToMessage, 
  replyType = 'reply', 
  scheduledTime 
}: ComposeModalProps) {
  const { 
    composeData, 
    cancelCompose, 
    getAccountsArray,
    currentAccountId,
    getCurrentAccount,
    switchAccount,
    currentMessage
  } = useMailStore();

  const activeAccount = getCurrentAccount();
  const accounts = getAccountsArray();

  // UI State
  const [isMinimized, setIsMinimized] = useState(false);
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);
  const [toFieldFocused, setToFieldFocused] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  
  // Form State
  const [compose, setCompose] = useState<ComposeRequest>({
    accountId: activeAccount?.id || '',
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    bodyText: '',
    bodyHtml: '',
    importance: MessageImportance.Normal,
    deliveryReceipt: false,
    readReceipt: false,
    scheduleSend: scheduledTime
  });
  // Keep accountId in sync once accounts load/hydrate
  useEffect(() => {
    if (activeAccount?.id && compose.accountId !== activeAccount.id) {
      setCompose(prev => ({ ...prev, accountId: activeAccount.id }));
    }
  }, [activeAccount?.id]);
  const [editorContent, setEditorContent] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Status States
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  
  // Error States
  const [gmailError, setGmailError] = useState<GmailError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Refs
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize compose from reply/forward
  useEffect(() => {
    const initializeReply = async () => {
      if (replyToMessage && activeAccount?.id) {
        try {
          const replyCompose = await GmailComposeService.formatReplyMessage(
            activeAccount.id,
            replyToMessage.id,
            replyType
          );
          setCompose(replyCompose);
          
          // Show CC if replying to all
          if (replyType === 'reply_all') {
            setCcVisible(true);
          }
        } catch (error) {
          console.error('Failed to initialize reply:', error);
        }
      }
    };
    initializeReply();
  }, [replyToMessage, replyType, activeAccount?.id]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (compose.subject.trim() || compose.bodyText?.trim() || compose.bodyHtml?.trim()) {
        setAutoSaveStatus('saving');
        try {
          const draftResponse = await GmailComposeService.autoSaveDraft(
            compose,
            currentDraftId,
            2000 // 2 second debounce
          );
          setCurrentDraftId(draftResponse.draftId);
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      }
    };

    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [compose, currentDraftId]);

  // Validation
  useEffect(() => {
    const errors = gmailComposeUtils.validateComposeRequest(compose);
    setValidationErrors(errors);
  }, [compose]);

  // Sync editor content to compose body (text + html)
  useEffect(() => {
    if (!editorContent) {
      // Set a minimal empty paragraph for empty content
      setCompose(prev => ({ ...prev, bodyText: ' ', bodyHtml: '<p>&nbsp;</p>' }));
      return;
    }
    try {
      const html = blocksToHtml(editorContent);
      const text = blocksToText(editorContent);
      // Ensure we always have some content, even if empty
      setCompose(prev => ({ 
        ...prev, 
        bodyText: text || ' ', 
        bodyHtml: html || '<p>&nbsp;</p>' 
      }));
    } catch (error) {
      console.error('[COMPOSE] Error converting editor content:', error);
      // Fallback to simple text
      setCompose(prev => ({ 
        ...prev, 
        bodyText: editorContent || ' ', 
        bodyHtml: `<p>${editorContent || '&nbsp;'}</p>` 
      }));
    }
  }, [editorContent]);

  // Event Handlers

  const handleSend = async () => {
    if (validationErrors.length > 0) {
      console.error('[COMPOSE] Validation errors:', validationErrors);
      return;
    }

    console.log('[COMPOSE] Sending email with data:', {
      to: compose.to,
      subject: compose.subject,
      bodyText: compose.bodyText?.substring(0, 100) + '...',
      bodyHtml: compose.bodyHtml?.substring(0, 100) + '...',
      attachments: attachments.length
    });

    setIsSending(true);
    setGmailError(null);
    
    try {
      const response = await GmailComposeService.sendMessage(compose);
      setSuccessMessage('Email sent successfully!');
      
      // Close modal after successful send
      setTimeout(() => {
        cancelCompose();
      }, 2000);
    } catch (error) {
      console.error('Failed to send email:', error);
      // Surface the actual error string for debugging
      const msg = (error as any)?.message || String(error);
      console.error('[COMPOSE] Send error detail:', msg);
      
      // Handle the error with our comprehensive error handler
      const context: ErrorContext = {
        operation: 'send_message',
        accountId: compose.accountId,
        threadId: compose.threadId
      };
      
      const gmailError = handleGmailError(error, context);
      setGmailError(gmailError);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!compose.subject && !compose.bodyText && !compose.bodyHtml) {
      return; // Don't save empty drafts
    }

    setIsSavingDraft(true);
    try {
      const draft = await GmailComposeService.saveDraft({
        accountId: compose.accountId,
        draftId: currentDraftId,
        composeData: compose
      });
      setCurrentDraftId(draft.draftId);
      setAutoSaveStatus('saved');
      
      // Reset save status after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setAutoSaveStatus('error');
      
      const context: ErrorContext = {
        operation: 'save_draft',
        accountId: compose.accountId
      };
      
      const gmailError = handleGmailError(error, context);
      setGmailError(gmailError);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!currentDraftId) {
      // No draft to delete, just close the compose modal
      cancelCompose();
      return;
    }

    try {
      await GmailComposeService.deleteDraft(compose.accountId, currentDraftId);
      setCurrentDraftId(undefined);
      cancelCompose();
    } catch (error) {
      console.error('Failed to delete draft:', error);
      
      const context: ErrorContext = {
        operation: 'delete_draft',
        accountId: compose.accountId
      };
      
      const gmailError = handleGmailError(error, context);
      setGmailError(gmailError);
    }
  };


  // Position the compose modal like Gmail: docked to bottom-right of the mail main column (left of context panel)
  const [modalPosition, setModalPosition] = useState<{ [k: string]: string }>({ right: '24px', bottom: '24px', transform: 'none', width: '600px' });
  const [dockRight, setDockRight] = useState<string>('24px');
  
  useLayoutEffect(() => {
    const margin = 24; // baseline margin inside main
    const contextGutter = 16; // extra inset to avoid the context panel gutter
    const nudge = 28; // pull left ~30px to fully clear the gutter
    const desiredRight = 38; // micro-tweak: +2px left for pixel-perfect alignment
    const computeDock = () => {
      const main = document.querySelector('[data-mail-main]') as HTMLElement | null;
      let widthPx = 600;
      if (main) {
        const rect = main.getBoundingClientRect();
        // Constrain width to fit within main column
        widthPx = Math.min(600, Math.max(360, Math.floor(rect.width - (margin * 2 + contextGutter + nudge))));
      }
      // Force a fixed right offset to align with content column and clear gutter
      setDockRight(`${desiredRight}px`);
      setModalPosition({ right: `${desiredRight}px`, bottom: `${margin}px`, transform: 'none', width: `${widthPx}px` });
    };

    computeDock();
    window.addEventListener('resize', computeDock);
    // Observe main column size/position changes (e.g., context panel toggles)
    const main = document.querySelector('[data-mail-main]') as HTMLElement | null;
    const ro = (typeof ResizeObserver !== 'undefined' && main) ? new ResizeObserver(() => computeDock()) : null;
    if (ro && main) ro.observe(main);
    return () => {
      window.removeEventListener('resize', computeDock);
      if (ro && main) ro.unobserve(main);
    };
  }, []);

  // Handle case where compose modal is open but draft creation failed
  if (!composeData) {
    return (
                <div className="border-border-subtle fixed bottom-0 right-4 z-50 flex h-[400px] w-[700px] flex-col rounded-t-lg border bg-content shadow-xl">
        <div className="border-border-subtle flex items-center justify-between border-b bg-secondary p-3">
          <Text size="sm" weight="medium" className="text-primary">
            New message
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelCompose}
            className="size-6 text-secondary hover:text-primary"
            aria-label="Close compose"
          >
            <X size={14} />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <AlertCircle size={24} className="mx-auto mb-2 text-error" />
            <Text size="sm" className="mb-1 text-primary">
              Failed to initialize compose
            </Text>
            <Text size="xs" className="mb-4 text-secondary">
              Please try again or check your connection
            </Text>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                cancelCompose();
                // Trigger a retry by closing and reopening
                setTimeout(() => {
                  const store = useMailStore.getState();
                  store.startCompose();
                }, 100);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="compose-modal--min border-border-subtle fixed bottom-0 z-50 w-80 rounded-t-lg border bg-content shadow-lg" style={{ right: dockRight }}>
        <div className="border-border-subtle flex items-center justify-between border-b p-3">
          <div className="flex flex-1 items-center gap-2">
            <Text size="sm" weight="medium" className="truncate text-primary">
              {compose.subject || 'New Message'}
            </Text>
            {autoSaveStatus === 'saving' && (
              <div className="size-2 animate-pulse rounded-full bg-accent-primary" />
            )}
            {autoSaveStatus === 'saved' && (
              <CheckCircle size={12} className="text-success" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(false)}
              className="size-6 text-secondary hover:text-primary"
            >
              <Maximize2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelCompose}
              className="size-6 text-secondary hover:text-primary"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] pointer-events-none">
      <div 
        className="compose-modal border-border-default pointer-events-auto fixed flex h-[600px] max-h-[90vh] w-[95vw] max-w-[600px] flex-col overflow-hidden rounded-lg border bg-content shadow-2xl"
        style={modalPosition}
      >
        {/* Header - Gmail-style compact */}
        <div className="border-border-default flex h-11 shrink-0 items-center justify-between border-b bg-secondary px-3">
          <div className="flex items-center gap-2">
            <Text size="sm" weight="medium" className="text-primary">
              New message
            </Text>
            
            {/* Auto-save indicator */}
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-[11px] text-secondary">
                <div className="size-3 animate-spin rounded-full border-2 border-accent-primary border-t-transparent"></div>
                Saving...
              </div>
            )}
            {autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-[11px] text-success">
                <CheckCircle size={12} />
                Saved
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelCompose}
            className="size-7 text-secondary hover:text-primary"
            aria-label="Close compose"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Account Selector (if multiple accounts) */}
        {accounts.length > 1 && (
          <div className="border-border-default border-b bg-tertiary px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Text size="sm" className="min-w-0 text-secondary">
                From:
              </Text>
              <select
                value={currentAccountId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    switchAccount(e.target.value);
                    setCompose(prev => ({ ...prev, accountId: e.target.value }));
                  }
                }}
                className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-transparent px-3 py-1 asana-text-sm text-primary hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id} className="bg-primary text-primary">
                    {account.displayName} ({account.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Recipients Section */}
          <div>
            {/* To Field */}
            <div className="flex min-h-[40px] items-center px-3">
              <EmailAutocomplete
                value={compose.to.map(addr => typeof addr === 'string' ? addr : addr.email)}
                onChange={(emails) => {
                  setCompose(prev => ({
                    ...prev,
                    to: emails.map(email => ({ email, name: '' }))
                  }));
                }}
                placeholder={toFieldFocused ? "To" : "Recipients"}
                multiple={true}
                className="flex-1"
                borderless
                onFocus={() => setToFieldFocused(true)}
                onBlur={() => setToFieldFocused(false)}
              />
              {toFieldFocused && (
                <div className="flex items-center px-2">
                  <button
                    type="button"
                    onClick={() => setCcVisible(!ccVisible)}
                    className="px-2 py-1 text-[13px] text-secondary hover:text-primary"
                  >
                    Cc
                  </button>
                  <button
                    type="button"
                    onClick={() => setBccVisible(!bccVisible)}
                    className="px-2 py-1 text-[13px] text-secondary hover:text-primary"
                  >
                    Bcc
                  </button>
                </div>
              )}
            </div>

            {/* CC Field */}
            {ccVisible && (
              <div className="flex min-h-[40px] items-center border-b border-[var(--border-subtle)] px-3">
                <span className="mr-2 text-[13px] text-secondary">
                  Cc
                </span>
                <EmailAutocomplete
                  value={compose.cc?.map(addr => typeof addr === 'string' ? addr : addr.email) || []}
                  onChange={(emails) => {
                    setCompose(prev => ({
                      ...prev,
                      cc: emails.map(email => ({ email, name: '' }))
                    }));
                  }}
                  placeholder=""
                  multiple={true}
                  className="flex-1"
                />
              </div>
            )}

            {/* BCC Field */}
            {bccVisible && (
              <div className="flex min-h-[40px] items-center border-b border-[var(--border-subtle)] px-3">
                <span className="mr-2 text-[13px] text-secondary">
                  Bcc
                </span>
                <EmailAutocomplete
                  value={compose.bcc?.map(addr => typeof addr === 'string' ? addr : addr.email) || []}
                  onChange={(emails) => {
                    setCompose(prev => ({
                      ...prev,
                      bcc: emails.map(email => ({ email, name: '' }))
                    }));
                  }}
                  placeholder=""
                  multiple={true}
                  className="flex-1"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="flex h-10 items-center">
              <input
                ref={subjectInputRef}
                type="text"
                value={compose.subject}
                onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject"
                className="flex-1 border-0 bg-transparent px-3 py-2 text-[14px] text-primary placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          {/* Message Body (BlockNote editor) */}
          <div className="relative flex flex-1 flex-col overflow-y-auto">
            <ComposeEditor
              value={editorContent}
              onChange={setEditorContent}
            />
          </div>
          
          {/* Attachments display */}
          {attachments.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] px-3 py-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-1 rounded bg-[var(--bg-tertiary)] px-2 py-1 text-xs"
                  >
                    <Paperclip size={12} />
                    <span className="max-w-[150px] truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[color:var(--text-tertiary)]">
                      ({file.size < 1024 * 1024 
                        ? `${(file.size / 1024).toFixed(1)}KB`
                        : `${(file.size / (1024 * 1024)).toFixed(1)}MB`
                      })
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachments(prev => prev.filter((_, i) => i !== index));
                        console.log('[ATTACH] File removed:', file.name);
                      }}
                      className="ml-1 text-[color:var(--text-secondary)] hover:text-[color:var(--error)]"
                      title="Remove attachment"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suppress banner-style validation; inline validation will be used near fields */}

        {gmailError && (
          <div className="border-border-default border-t bg-error-ghost px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-error" />
              <Text size="sm" className="text-error">
                {gmailError.message}
              </Text>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="border-border-default border-t bg-success-ghost px-4 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <Text size="sm" className="text-success">
                {successMessage}
              </Text>
            </div>
          </div>
        )}

        {/* Footer Actions - Gmail-style compact */}
        <div className="border-border-default flex h-12 shrink-0 items-center justify-between border-t bg-primary px-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || validationErrors.length > 0}
              className="flex h-8 items-center gap-1.5 rounded-md bg-accent-primary px-4 text-[13px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send
                </>
              )}
            </button>

            {/* Formatting toolbar icons */}
            <div className="mx-2 h-5 w-px bg-[var(--border-subtle)]" />
            
            <button
              type="button"
              title="Attach files"
              className="inline-flex size-7 items-center justify-center rounded text-secondary hover:bg-[var(--bg-tertiary)]"
            >
              <label className="flex size-full cursor-pointer items-center justify-center">
                <Paperclip size={15} />
                <input 
                  type="file" 
                  multiple 
                  className="sr-only"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setAttachments(prev => [...prev, ...files]);
                      console.log('[ATTACH] Files added:', files.map(f => f.name));
                    }
                  }}
                />
              </label>
            </button>
            
            <button
              type="button"
              onClick={() => setShowScheduler(!showScheduler)}
              className="inline-flex size-7 items-center justify-center rounded text-secondary hover:bg-[var(--bg-tertiary)]"
              title="Schedule send"
            >
              <Timer size={15} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] text-secondary hover:bg-[var(--bg-tertiary)]"
            >
              {isSavingDraft ? (
                <>
                  <div className="size-3 animate-spin rounded-full border border-secondary border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save draft
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleDeleteDraft}
              className="inline-flex size-7 items-center justify-center rounded text-secondary hover:bg-[var(--bg-tertiary)] hover:text-error"
              title="Delete draft"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComposeModal;
