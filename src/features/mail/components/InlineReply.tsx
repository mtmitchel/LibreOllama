import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Paperclip, Timer, Save, Trash2 } from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { ParsedEmail } from '../types';
import { useMailStore } from '../stores/mailStore';
import ComposeEditor from './ComposeEditor';
import { blocksToHtml, blocksToText } from '../../notes/utils/blocksToHtml';
import { 
  GmailComposeService, 
  ComposeRequest, 
  EmailAddress as ComposeEmailAddress,
  MessageImportance,
  gmailComposeUtils
} from '../services/gmailComposeService';
import { handleGmailError, GmailError, ErrorContext } from '../services/gmailErrorHandler';

interface InlineReplyProps {
  originalMessage: ParsedEmail;
  replyType: 'reply' | 'reply_all' | 'forward';
  onClose: () => void;
}

export function InlineReply({ originalMessage, replyType, onClose }: InlineReplyProps) {
  const store = useMailStore.getState();
  const activeAccount = store.getCurrentAccount();
  
  // UI State
  const [toFieldFocused, setToFieldFocused] = useState(false);
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);
  
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
    readReceipt: false
  });
  const [editorContent, setEditorContent] = useState<string>('');
  
  // Status States
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const [gmailError, setGmailError] = useState<GmailError | null>(null);
  
  // Refs
  const toInputRef = useRef<HTMLInputElement>(null);

  // Initialize compose from reply/forward
  useEffect(() => {
    const initializeReply = async () => {
      if (originalMessage && activeAccount?.id) {
        try {
          // Convert ParsedEmail to the format expected by formatReplyMessage
          const messageForReply = {
            id: originalMessage.id,
            threadId: originalMessage.threadId || originalMessage.id,
            subject: originalMessage.subject,
            from: {
              email: originalMessage.from.email,
              name: originalMessage.from.name || ''
            },
            to: originalMessage.to.map(addr => ({
              email: addr.email,
              name: addr.name || ''
            })),
            cc: originalMessage.cc?.map(addr => ({
              email: addr.email,
              name: addr.name || ''
            })),
            body: originalMessage.body,
            date: originalMessage.date.toISOString()
          };
          
          const replyCompose = await GmailComposeService.formatReplyMessage(
            activeAccount.id,
            messageForReply.id,
            replyType
          );
          setCompose(replyCompose);
          
          // Show CC if replying to all
          if (replyType === 'reply_all') {
            setCcVisible(true);
          }
          
          // Focus on appropriate field
          if (replyType === 'forward') {
            setTimeout(() => toInputRef.current?.focus(), 100);
          } else {
            // For reply, focus will be handled by the editor
          }
        } catch (error) {
          console.error('Failed to initialize reply:', error);
        }
      }
    };
    initializeReply();
  }, [originalMessage, replyType, activeAccount?.id]);

  // Sync editor content to compose body
  useEffect(() => {
    if (!editorContent) {
      setCompose(prev => ({ ...prev, bodyText: '', bodyHtml: '' }));
      return;
    }
    try {
      const html = blocksToHtml(editorContent);
      const text = blocksToText(editorContent);
      setCompose(prev => ({ ...prev, bodyText: text, bodyHtml: html }));
    } catch {
      setCompose(prev => ({ ...prev, bodyText: editorContent, bodyHtml: editorContent }));
    }
  }, [editorContent]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (compose.subject.trim() || compose.bodyText?.trim() || compose.bodyHtml?.trim()) {
        setAutoSaveStatus('saving');
        try {
          const draftResponse = await GmailComposeService.autoSaveDraft(
            compose,
            currentDraftId,
            2000
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
    const validationErrors = gmailComposeUtils.validateComposeRequest(compose);
    if (validationErrors.length > 0) {
      return;
    }

    setIsSending(true);
    setGmailError(null);
    
    try {
      const response = await GmailComposeService.sendMessage(compose);
      
      // Auto-archive after reply if enabled
      const settings = store.settings;
      const current = store.currentMessage;
      if (settings.mailAutoArchiveAfterReply && current) {
        await store.archiveMessages([current.id], current.accountId);
      }
      
      // Close the reply section
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      
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
      return;
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
      // No draft to delete, just close the reply
      onClose();
      return;
    }

    try {
      await GmailComposeService.deleteDraft(compose.accountId, currentDraftId);
      setCurrentDraftId(undefined);
      onClose();
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

  const formatEmailAddresses = (addresses: ComposeEmailAddress[] = []) => {
    return addresses.map(addr => addr.email || '').join(', ');
  };

  return (
    <div className="border-border-default border-t bg-content">
      {/* Header - Gmail-style compact */}
      <div className="border-border-default flex h-11 items-center justify-between border-b bg-secondary px-3">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium" className="text-primary">
            {replyType === 'reply' ? 'Reply' : replyType === 'reply_all' ? 'Reply all' : 'Forward'}
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
              <Save size={12} />
              Saved
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-7 text-secondary hover:text-primary"
          aria-label="Close reply"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Recipients Section */}
      <div className="border-border-default border-b">
        {/* To Field */}
        <div className="flex h-10 items-center border-b border-[var(--border-subtle)]">
          {toFieldFocused && (
            <span className="px-3 text-[13px] text-secondary">
              To
            </span>
          )}
          <input
            ref={toInputRef}
            type="text"
            value={formatEmailAddresses(compose.to)}
            onChange={(e) => handleEmailAddressChange('to', e.target.value)}
            onFocus={() => setToFieldFocused(true)}
            onBlur={() => setToFieldFocused(compose.to.length > 0)}
            placeholder={toFieldFocused ? "" : "Recipients"}
            className="flex-1 border-0 bg-transparent px-3 py-2 text-[14px] text-primary placeholder:text-muted focus:outline-none"
          />
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
        </div>

        {/* CC Field */}
        {ccVisible && (
          <div className="flex h-10 items-center border-b border-[var(--border-subtle)]">
            <span className="px-3 text-[13px] text-secondary">
              Cc
            </span>
            <input
              type="text"
              value={formatEmailAddresses(compose.cc)}
              onChange={(e) => handleEmailAddressChange('cc', e.target.value)}
              placeholder=""
              className="flex-1 border-0 bg-transparent px-2 py-2 text-[14px] text-primary placeholder:text-muted focus:outline-none"
            />
          </div>
        )}

        {/* BCC Field */}
        {bccVisible && (
          <div className="flex h-10 items-center border-b border-[var(--border-subtle)]">
            <span className="px-3 text-[13px] text-secondary">
              Bcc
            </span>
            <input
              type="text"
              value={formatEmailAddresses(compose.bcc)}
              onChange={(e) => handleEmailAddressChange('bcc', e.target.value)}
              placeholder=""
              className="flex-1 border-0 bg-transparent px-2 py-2 text-[14px] text-primary placeholder:text-muted focus:outline-none"
            />
          </div>
        )}

        {/* Subject Field */}
        <div className="flex h-10 items-center">
          <input
            type="text"
            value={compose.subject}
            onChange={(e) => setCompose(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Subject"
            className="flex-1 border-0 bg-transparent px-3 py-2 text-[14px] text-primary placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Message Body with ComposeEditor */}
      <div className="min-h-[300px]">
        <ComposeEditor
          value={editorContent}
          onChange={setEditorContent}
        />
      </div>

      {/* Error display */}
      {gmailError && (
        <div className="border-border-default border-t bg-error-ghost px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-error text-sm">{gmailError.message}</span>
          </div>
        </div>
      )}

      {/* Footer Actions - Gmail-style compact */}
      <div className="border-border-default flex h-12 items-center justify-between border-t bg-primary px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || gmailComposeUtils.validateComposeRequest(compose).length > 0}
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
              <input type="file" multiple className="sr-only" />
            </label>
          </button>
          
          <button
            type="button"
            title="Schedule send"
            className="inline-flex size-7 items-center justify-center rounded text-secondary hover:bg-[var(--bg-tertiary)]"
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
  );
}

export default InlineReply;