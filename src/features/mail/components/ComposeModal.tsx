import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Paperclip, 
  Image, 
  Smile,
  MoreHorizontal,
  Trash2,
  Timer,
  Save,
  Eye,
  AlertCircle,
  CheckCircle,
  Calendar,
  Star,
  AlertTriangle,
  FileText,
  Edit3,
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
  MessageTemplate,
  SendResponse,
  DraftResponse,
  gmailComposeUtils,
  GmailComposeError
} from '../services/gmailComposeService';
import { 
  handleGmailError, 
  retryGmailOperation, 
  GmailError, 
  GmailErrorType,
  ErrorContext 
} from '../services/gmailErrorHandler';
import { ErrorDisplay, SuccessMessage, LoadingMessage } from './ErrorDisplay';

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
  templateId?: string;
  scheduledTime?: string;
}

export function ComposeModal({ 
  replyToMessage, 
  replyType = 'reply', 
  templateId, 
  scheduledTime 
}: ComposeModalProps) {
  const { 
    composeData, 
    updateCompose, 
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [richTextMode, setRichTextMode] = useState(false);
  
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
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  
  // Error States
  const [gmailError, setGmailError] = useState<GmailError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data States
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [sendResponse, setSendResponse] = useState<SendResponse | null>(null);

  // Refs
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const richTextEditorRef = useRef<HTMLDivElement>(null);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (activeAccount?.id) {
        try {
          const templates = await GmailComposeService.getMessageTemplates(activeAccount.id);
          setTemplates(templates);
        } catch (error) {
          console.error('Failed to load templates:', error);
        }
      }
    };
    loadTemplates();
  }, [activeAccount?.id]);

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
    setSendStatus('idle');
    setGmailError(null);
    
    try {
      const response = await GmailComposeService.sendMessage(compose);
      setSendResponse(response);
      setSendStatus('success');
      setSuccessMessage('Email sent successfully!');
      
      // Close modal after successful send
      setTimeout(() => {
        cancelCompose();
      }, 2000);
    } catch (error) {
      console.error('Failed to send email:', error);
      setSendStatus('error');
      
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

  const handleScheduleSend = async (scheduleTime: string) => {
    if (validationErrors.length > 0) {
      return;
    }

    setIsSending(true);
    setSendStatus('idle');
    setGmailError(null);
    
    try {
      const composeWithSchedule = { ...compose, scheduleSend: scheduleTime };
      const response = await GmailComposeService.scheduleMessage(composeWithSchedule, scheduleTime);
      setSendResponse(response);
      setSendStatus('success');
      setSuccessMessage(`Email scheduled for ${new Date(scheduleTime).toLocaleString()}`);
      
      // Close modal after successful scheduling
      setTimeout(() => {
        cancelCompose();
      }, 2000);
    } catch (error) {
      console.error('Failed to schedule email:', error);
      setSendStatus('error');
      
      // Handle the error with our comprehensive error handler
      const context: ErrorContext = {
        operation: 'schedule_message',
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
    setIsSavingDraft(true);
    setGmailError(null);
    
    try {
      const draftResponse = await GmailComposeService.saveDraft({
        accountId: compose.accountId,
        draftId: currentDraftId,
        composeData: compose
      });
      setCurrentDraftId(draftResponse.draftId);
      setAutoSaveStatus('saved');
      setSuccessMessage('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      setAutoSaveStatus('error');
      
      // Handle the error with our comprehensive error handler
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

  const handleApplyTemplate = async (template: MessageTemplate) => {
    setIsLoadingTemplate(true);
    
    try {
      // Get template variables from user (simplified for demo)
      const variables: Record<string, string> = {};
      for (const variable of template.variables) {
        const value = prompt(`Enter ${variable.description}:`, variable.defaultValue || '');
        if (value !== null) {
          variables[variable.name] = value;
        }
      }
      
      const { subject, body } = gmailComposeUtils.applyTemplate(template, variables);
      setCompose(prev => ({
        ...prev,
        subject,
        bodyText: body,
        bodyHtml: richTextMode ? gmailComposeUtils.textToHtml(body) : ''
      }));
      
      setShowTemplates(false);
    } catch (error) {
      console.error('Failed to apply template:', error);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleImportanceChange = (importance: MessageImportance) => {
    setCompose(prev => ({ ...prev, importance }));
  };

  const handleToggleRichText = () => {
    if (richTextMode) {
      // Convert HTML to text
      const text = gmailComposeUtils.htmlToText(compose.bodyHtml || '');
      setCompose(prev => ({ ...prev, bodyText: text, bodyHtml: '' }));
    } else {
      // Convert text to HTML
      const html = gmailComposeUtils.textToHtml(compose.bodyText || '');
      setCompose(prev => ({ ...prev, bodyHtml: html }));
    }
    setRichTextMode(!richTextMode);
  };

  const formatEmailAddresses = (addresses: ComposeEmailAddress[]) => {
    return addresses.map(addr => gmailComposeUtils.formatEmailAddress(addr)).join(', ');
  };

  const getMessageSizeWarning = () => {
    if (gmailComposeUtils.isMessageTooLarge(compose)) {
      return 'Message size exceeds Gmail limit (25MB)';
    }
    const size = gmailComposeUtils.estimateMessageSize(compose);
    if (size > 10 * 1024 * 1024) {
      return `Large message (${(size / 1024 / 1024).toFixed(1)} MB)`;
    }
    return null;
  };

  // Handle case where compose modal is open but draft creation failed
  if (!composeData) {
    return (
      <div className="fixed bottom-0 right-4 w-[700px] h-[400px] bg-[var(--bg-primary)] border border-border-subtle rounded-t-lg shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border-subtle bg-[var(--bg-secondary)]">
          <Text size="sm" weight="medium" className="text-primary">
            New Message
          </Text>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelCompose}
            className="h-6 w-6 text-secondary hover:text-primary"
          >
            <X size={14} />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={24} className="text-error mx-auto mb-2" />
            <Text size="sm" className="text-primary mb-1">
              Failed to initialize compose
            </Text>
            <Text size="xs" className="text-secondary mb-4">
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
      <div className="fixed bottom-0 right-4 w-80 bg-[var(--bg-primary)] border border-border-subtle rounded-t-lg shadow-lg z-50">
        <div className="flex items-center justify-between p-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 flex-1">
            <Text size="sm" weight="medium" className="text-primary truncate">
              {compose.subject || 'New Message'}
            </Text>
            {autoSaveStatus === 'saving' && (
              <div className="animate-pulse h-2 w-2 bg-accent-primary rounded-full" />
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
              className="h-6 w-6 text-secondary hover:text-primary"
            >
              <Maximize2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelCompose}
              className="h-6 w-6 text-secondary hover:text-primary"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[var(--bg-primary)] rounded-lg shadow-2xl border border-[var(--border-default)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            {replyType === 'reply' && <Reply size={18} className="text-[var(--text-secondary)]" />}
            {replyType === 'reply_all' && <Users size={18} className="text-[var(--text-secondary)]" />}
            {replyType === 'forward' && <Forward size={18} className="text-[var(--text-secondary)]" />}
            <Text size="md" weight="semibold" className="text-[var(--text-primary)]">
              {replyType === 'reply' ? 'Reply' : 
               replyType === 'reply_all' ? 'Reply All' : 
               replyType === 'forward' ? 'Forward' : 'New Message'}
            </Text>
            
            {/* Auto-save indicator */}
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-[var(--accent-primary)] border-t-transparent"></div>
                Saving...
              </div>
            )}
            {autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-xs text-[var(--success)]">
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
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Account Selector (if multiple accounts) */}
        {accounts.length > 1 && (
          <div className="px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-tertiary)]">
            <div className="flex items-center gap-2">
              <Text size="sm" className="text-[var(--text-secondary)] min-w-0">
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
                className="flex-1 bg-transparent border border-[var(--border-default)] rounded-md px-3 py-1 text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
                    {account.displayName} ({account.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Recipients Section */}
          <div className="p-4 space-y-3 border-b border-[var(--border-default)]">
            {/* To Field */}
            <div className="flex items-center gap-3">
              <Text size="sm" className="text-[var(--text-secondary)] w-12 text-right">
                To:
              </Text>
              <input
                ref={toInputRef}
                type="text"
                value={formatEmailAddresses(compose.to)}
                onChange={(e) => handleEmailAddressChange('to', e.target.value)}
                placeholder="Enter recipients..."
                className="flex-1 bg-transparent border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCcVisible(!ccVisible)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cc
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBccVisible(!bccVisible)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Bcc
                </Button>
              </div>
            </div>

            {/* CC Field */}
            {ccVisible && (
              <div className="flex items-center gap-3">
                <Text size="sm" className="text-[var(--text-secondary)] w-12 text-right">
                  Cc:
                </Text>
                <input
                  ref={ccInputRef}
                  type="text"
                  value={formatEmailAddresses(compose.cc)}
                  onChange={(e) => handleEmailAddressChange('cc', e.target.value)}
                  placeholder="Enter CC recipients..."
                  className="flex-1 bg-transparent border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
            )}

            {/* BCC Field */}
            {bccVisible && (
              <div className="flex items-center gap-3">
                <Text size="sm" className="text-[var(--text-secondary)] w-12 text-right">
                  Bcc:
                </Text>
                <input
                  ref={bccInputRef}
                  type="text"
                  value={formatEmailAddresses(compose.bcc)}
                  onChange={(e) => handleEmailAddressChange('bcc', e.target.value)}
                  placeholder="Enter BCC recipients..."
                  className="flex-1 bg-transparent border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="flex items-center gap-3">
              <Text size="sm" className="text-[var(--text-secondary)] w-12 text-right">
                Subject:
              </Text>
              <input
                ref={subjectInputRef}
                type="text"
                value={compose.subject}
                onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject..."
                className="flex-1 bg-transparent border border-[var(--border-default)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4">
              <textarea
                ref={bodyTextareaRef}
                value={compose.bodyText}
                onChange={(e) => setCompose(prev => ({ ...prev, bodyText: e.target.value }))}
                placeholder="Write your message..."
                className="w-full h-full resize-none bg-transparent border border-[var(--border-default)] rounded-md p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {validationErrors.length > 0 && (
          <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--error-ghost)]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[var(--error)]" />
              <Text size="sm" className="text-[var(--error)]">
                {validationErrors[0]}
              </Text>
            </div>
          </div>
        )}

        {gmailError && (
          <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--error-ghost)]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[var(--error)]" />
              <Text size="sm" className="text-[var(--error)]">
                {gmailError.message}
              </Text>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--success-ghost)]">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[var(--success)]" />
              <Text size="sm" className="text-[var(--success)]">
                {successMessage}
              </Text>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={isSending || validationErrors.length > 0}
              className="flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--accent-primary)] border-t-transparent"></div>
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
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Attach files"
            >
              <Paperclip size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScheduler(!showScheduler)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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