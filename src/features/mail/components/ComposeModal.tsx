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
    composeDraft, 
    updateCompose, 
    cancelCompose, 
    accounts,
    currentAccountId,
    getCurrentAccount,
    switchAccount
  } = useMailStore();

  const activeAccount = getCurrentAccount();

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
  if (!composeDraft) {
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
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'bottom-0 right-4 w-[700px] h-[600px]'} bg-[var(--bg-primary)] border border-border-subtle ${isFullscreen ? '' : 'rounded-t-lg'} shadow-xl z-50 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {replyType === 'reply' && <Reply size={16} className="text-secondary" />}
              {replyType === 'reply_all' && <Users size={16} className="text-secondary" />}
              {replyType === 'forward' && <Forward size={16} className="text-secondary" />}
              <Text size="sm" weight="medium" className="text-primary">
                {replyType === 'reply' ? 'Reply' : 
                 replyType === 'reply_all' ? 'Reply All' : 
                 replyType === 'forward' ? 'Forward' : 'New Message'}
              </Text>
            </div>
            
            {/* Account Selector */}
            {accounts.length > 1 && (
              <div className="flex items-center gap-2">
                <Text size="xs" className="text-secondary">
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
                  className="bg-transparent border border-border-subtle rounded px-2 py-1 text-xs text-primary hover:border-accent-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id} className="bg-[var(--bg-primary)] text-primary">
                      {account.name} ({account.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Auto-save status */}
          <div className="flex items-center gap-1">
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-1 text-xs text-secondary">
                <div className="animate-pulse h-2 w-2 bg-accent-primary rounded-full" />
                Saving...
              </div>
            )}
            {autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-xs text-success">
                <CheckCircle size={12} />
                Saved
              </div>
            )}
            {autoSaveStatus === 'error' && (
              <div className="flex items-center gap-1 text-xs text-error">
                <AlertCircle size={12} />
                Save failed
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 text-secondary hover:text-primary"
          >
            <Minimize2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
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

      {/* Success Message */}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
          className="m-3 -mb-3"
        />
      )}

      {/* Loading Message */}
      {isSending && (
        <LoadingMessage
          message="Sending email..."
          className="m-3 -mb-3"
        />
      )}

      {/* Error Display */}
      {gmailError && (
        <ErrorDisplay
          error={gmailError}
          onRetry={() => {
            if (gmailError.type === GmailErrorType.GMAIL_SEND_ERROR) {
              handleSend();
            } else if (gmailError.type === GmailErrorType.GMAIL_DRAFT_ERROR) {
              handleSaveDraft();
            }
          }}
          onDismiss={() => setGmailError(null)}
          className="m-3 -mb-3"
        />
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-warning/10 border-b border-warning/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            <Text size="sm" className="text-warning">
              {validationErrors[0]}
            </Text>
          </div>
        </div>
      )}

      {/* Size Warning */}
      {getMessageSizeWarning() && (
        <div className="bg-warning/10 border-b border-warning/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            <Text size="sm" className="text-warning">
              {getMessageSizeWarning()}
            </Text>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 flex flex-col">
        {/* Recipients */}
        <div className="border-b border-border-subtle">
          {/* To Field */}
          <div className="flex items-center px-3 py-2 border-b border-border-subtle">
            <Text size="sm" className="text-secondary w-12 flex-shrink-0">
              To
            </Text>
            <input
              ref={toInputRef}
              type="text"
              value={formatEmailAddresses(compose.to)}
              onChange={(e) => handleEmailAddressChange('to', e.target.value)}
              placeholder="Recipients"
              className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder-secondary"
            />
            <div className="flex items-center gap-1 ml-2">
              {!ccVisible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCcVisible(true)}
                  className="text-secondary hover:text-primary text-xs px-2 py-1"
                >
                  Cc
                </Button>
              )}
              {!bccVisible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBccVisible(true)}
                  className="text-secondary hover:text-primary text-xs px-2 py-1"
                >
                  Bcc
                </Button>
              )}
            </div>
          </div>

          {/* Cc Field */}
          {ccVisible && (
            <div className="flex items-center px-3 py-2 border-b border-border-subtle">
              <Text size="sm" className="text-secondary w-12 flex-shrink-0">
                Cc
              </Text>
              <input
                ref={ccInputRef}
                type="text"
                value={formatEmailAddresses(compose.cc || [])}
                onChange={(e) => handleEmailAddressChange('cc', e.target.value)}
                placeholder="Carbon copy"
                className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder-secondary"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCcVisible(false)}
                className="h-6 w-6 text-secondary hover:text-primary ml-2"
              >
                <X size={12} />
              </Button>
            </div>
          )}

          {/* Bcc Field */}
          {bccVisible && (
            <div className="flex items-center px-3 py-2 border-b border-border-subtle">
              <Text size="sm" className="text-secondary w-12 flex-shrink-0">
                Bcc
              </Text>
              <input
                ref={bccInputRef}
                type="text"
                value={formatEmailAddresses(compose.bcc || [])}
                onChange={(e) => handleEmailAddressChange('bcc', e.target.value)}
                placeholder="Blind carbon copy"
                className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder-secondary"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBccVisible(false)}
                className="h-6 w-6 text-secondary hover:text-primary ml-2"
              >
                <X size={12} />
              </Button>
            </div>
          )}

          {/* Subject Field */}
          <div className="flex items-center px-3 py-2">
            <Text size="sm" className="text-secondary w-12 flex-shrink-0">
              Subject
            </Text>
            <input
              ref={subjectInputRef}
              type="text"
              value={compose.subject}
              onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject"
              className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder-secondary"
            />
            
            {/* Importance indicator */}
            <div className="flex items-center gap-1 ml-2">
              {compose.importance === MessageImportance.High && (
                <AlertTriangle size={16} className="text-error" title="High importance" />
              )}
              {compose.importance === MessageImportance.Low && (
                <div className="w-4 h-4 rounded-full bg-secondary/30" title="Low importance" />
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-border-subtle p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleRichText}
              className={richTextMode ? 'bg-accent-primary/10 text-accent-primary' : 'text-secondary hover:text-primary'}
            >
              <Edit3 size={14} className="mr-1" />
              {richTextMode ? 'Plain Text' : 'Rich Text'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-secondary hover:text-primary"
            >
              <FileText size={14} className="mr-1" />
              Templates
            </Button>
            
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleImportanceChange(MessageImportance.High)}
                className={compose.importance === MessageImportance.High ? 'bg-error/10 text-error' : 'text-secondary hover:text-primary'}
                title="High importance"
              >
                <AlertTriangle size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleImportanceChange(MessageImportance.Low)}
                className={compose.importance === MessageImportance.Low ? 'bg-secondary/10 text-secondary' : 'text-secondary hover:text-primary'}
                title="Low importance"
              >
                <div className="w-4 h-4 rounded-full bg-current opacity-50" />
              </Button>
            </div>
          </div>
        </div>

        {/* Templates Panel */}
        {showTemplates && (
          <div className="border-b border-border-subtle p-3 bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-secondary" />
              <Text size="sm" weight="medium" className="text-primary">
                Message Templates
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Button
                  key={template.templateId}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApplyTemplate(template)}
                  disabled={isLoadingTemplate}
                  className="border border-border-subtle hover:bg-accent-primary/10 hover:border-accent-primary/20"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Body */}
        <div className="flex-1 p-3">
          {richTextMode ? (
            <div
              ref={richTextEditorRef}
              contentEditable
              className="w-full h-full bg-transparent border-none outline-none text-sm text-primary resize-none"
              style={{ minHeight: '200px' }}
              onInput={(e) => {
                const html = e.currentTarget.innerHTML;
                setCompose(prev => ({ ...prev, bodyHtml: html }));
              }}
              dangerouslySetInnerHTML={{ __html: compose.bodyHtml || '' }}
            />
          ) : (
            <textarea
              ref={bodyTextareaRef}
              value={compose.bodyText}
              onChange={(e) => setCompose(prev => ({ ...prev, bodyText: e.target.value }))}
              placeholder="Compose email"
              className="w-full h-full bg-transparent border-none outline-none text-sm text-primary placeholder-secondary resize-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSend}
                disabled={isSending || validationErrors.length > 0}
                className="bg-accent-primary hover:bg-accent-primary/90 text-white disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="border-border-subtle hover:bg-accent-primary/10"
              >
                {isSavingDraft ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Draft
                  </>
                )}
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-secondary hover:text-primary"
                  title="Attach files"
                >
                  <Paperclip size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-secondary hover:text-primary"
                  title="Insert photo"
                >
                  <Image size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-secondary hover:text-primary"
                  title="Insert emoji"
                >
                  <Smile size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScheduler(!showScheduler)}
                  className="h-8 w-8 text-secondary hover:text-primary"
                  title="Schedule send"
                >
                  <Timer size={16} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-secondary hover:text-primary"
                  title="More options"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={cancelCompose}
              className="h-8 w-8 text-secondary hover:text-primary"
              title="Discard"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          
          {/* Message size indicator */}
          {compose.bodyText || compose.bodyHtml ? (
            <div className="mt-2 text-xs text-secondary">
              Size: {(gmailComposeUtils.estimateMessageSize(compose) / 1024).toFixed(1)} KB
            </div>
          ) : null}
        </div>
      </div>

      {/* Schedule Panel */}
      {showScheduler && (
        <div className="absolute bottom-full left-0 right-0 bg-[var(--bg-primary)] border border-border-subtle rounded-t-lg shadow-lg p-4 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-secondary" />
            <Text size="sm" weight="medium" className="text-primary">
              Schedule Send
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              className="flex-1 bg-transparent border border-border-subtle rounded px-3 py-2 text-sm text-primary"
              min={new Date().toISOString().slice(0, 16)}
            />
            <Button
              onClick={() => {
                const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                if (input?.value) {
                  handleScheduleSend(new Date(input.value).toISOString());
                }
              }}
              disabled={isSending}
              className="bg-accent-primary hover:bg-accent-primary/90 text-white"
            >
              <Timer size={16} className="mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 