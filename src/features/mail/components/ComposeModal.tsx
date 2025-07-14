import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Maximize2, 
  Send, 
  Paperclip, 
  Timer,
  Save,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Reply,
  Forward,
  Users
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
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

export function ComposeModal({ 
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
    switchAccount
  } = useMailStore();

  const activeAccount = getCurrentAccount();
  const accounts = getAccountsArray();

  // UI State
  const [isMinimized, setIsMinimized] = useState(false);
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);
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
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
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

  // Event Handlers
  const handleEmailAddressChange = useCallback((
    field: 'to' | 'cc' | 'bcc', 
    value: string
  ) => {
    const emails = value.split(',').map(email => {
      const trimmed = email.trim();
      return gmailComposeUtils.parseEmailAddress(trimmed);
    }).filter(addr => addr.email);

    setCompose(prev => ({ ...prev, [field]: emails }));
  }, []);

  const handleSend = async () => {
    if (validationErrors.length > 0) {
      return;
    }

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

  const formatEmailAddresses = (addresses: ComposeEmailAddress[] = []) => {
    return addresses.map(addr => addr.email || '').join(', ');
  };

  // Handle case where compose modal is open but draft creation failed
  if (!composeData) {
    return (
                <div className="border-border-subtle fixed bottom-0 right-4 z-50 flex h-[400px] w-[700px] flex-col rounded-t-lg border bg-content shadow-xl">
        <div className="border-border-subtle flex items-center justify-between border-b bg-secondary p-3">
          <Text size="sm" weight="medium" className="text-primary">
            New Message
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelCompose}
            className="size-6 text-secondary hover:text-primary"
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
                <div className="border-border-subtle fixed bottom-0 right-4 z-50 w-80 rounded-t-lg border bg-content shadow-lg">
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
          <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="border-border-primary flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border bg-content shadow-2xl">
        {/* Header */}
        <div className="border-border-primary bg-bg-secondary flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            {replyType === 'reply' && <Reply size={18} className="text-secondary" />}
            {replyType === 'reply_all' && <Users size={18} className="text-secondary" />}
            {replyType === 'forward' && <Forward size={18} className="text-secondary" />}
            <Text size="base" weight="semibold" className="text-primary">
              {replyType === 'reply' ? 'Reply' : 
               replyType === 'reply_all' ? 'Reply All' : 
               replyType === 'forward' ? 'Forward' : 'New Message'}
            </Text>
            
            {/* Auto-save indicator */}
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="size-3 animate-spin rounded-full border-2 border-accent-primary border-t-transparent"></div>
                Saving...
              </div>
            )}
            {autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-xs text-success">
                <CheckCircle size={12} />
                Saved
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelCompose}
              className="text-secondary hover:text-primary"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Account Selector (if multiple accounts) */}
        {accounts.length > 1 && (
          <div className="border-border-default border-b bg-tertiary px-4 py-2">
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
                className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-transparent px-3 py-1 text-sm text-primary hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
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
          <div className="border-border-default space-y-3 border-b p-4">
            {/* To Field */}
            <div className="flex items-center gap-3">
              <Text size="sm" className="w-12 text-right text-secondary">
                To:
              </Text>
              <input
                ref={toInputRef}
                type="text"
                value={formatEmailAddresses(compose.to)}
                onChange={(e) => handleEmailAddressChange('to', e.target.value)}
                placeholder="Enter recipients..."
                className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCcVisible(!ccVisible)}
                  className="text-xs text-secondary hover:text-primary"
                >
                  Cc
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBccVisible(!bccVisible)}
                  className="text-xs text-secondary hover:text-primary"
                >
                  Bcc
                </Button>
              </div>
            </div>

            {/* CC Field */}
            {ccVisible && (
              <div className="flex items-center gap-3">
                <Text size="sm" className="w-12 text-right text-secondary">
                  Cc:
                </Text>
                <input
                  ref={ccInputRef}
                  type="text"
                  value={formatEmailAddresses(compose.cc)}
                  onChange={(e) => handleEmailAddressChange('cc', e.target.value)}
                  placeholder="Enter CC recipients..."
                  className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
                />
              </div>
            )}

            {/* BCC Field */}
            {bccVisible && (
              <div className="flex items-center gap-3">
                <Text size="sm" className="w-12 text-right text-secondary">
                  Bcc:
                </Text>
                <input
                  ref={bccInputRef}
                  type="text"
                  value={formatEmailAddresses(compose.bcc)}
                  onChange={(e) => handleEmailAddressChange('bcc', e.target.value)}
                  placeholder="Enter BCC recipients..."
                  className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="flex items-center gap-3">
              <Text size="sm" className="w-12 text-right text-secondary">
                Subject:
              </Text>
              <input
                ref={subjectInputRef}
                type="text"
                value={compose.subject}
                onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject..."
                className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 p-4">
              <textarea
                ref={bodyTextareaRef}
                value={compose.bodyText}
                onChange={(e) => setCompose(prev => ({ ...prev, bodyText: e.target.value }))}
                placeholder="Write your message..."
                className="border-border-default focus:ring-accent-primary size-full resize-none rounded-md border bg-transparent p-3 text-sm text-primary placeholder:text-muted hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1"
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {validationErrors.length > 0 && (
          <div className="border-border-default border-t bg-error-ghost px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-error" />
              <Text size="sm" className="text-error">
                {validationErrors[0]}
              </Text>
            </div>
          </div>
        )}

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

        {/* Footer Actions */}
        <div className="border-border-default flex items-center justify-between border-t bg-secondary p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={isSending || validationErrors.length > 0}
              className="flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2"
            >
              {isSavingDraft ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Draft
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary hover:text-primary"
              title="Attach files"
            >
              <Paperclip size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScheduler(!showScheduler)}
              className="text-secondary hover:text-primary"
              title="Schedule send"
            >
              <Timer size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}