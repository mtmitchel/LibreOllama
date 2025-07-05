import React, { useState, useRef } from 'react';
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
  Timer
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { EmailAddress } from '../types';

export function ComposeModal() {
  const { 
    composeDraft, 
    updateCompose, 
    sendEmail, 
    cancelCompose, 
    isSending 
  } = useMailStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ccVisible, setCcVisible] = useState(false);
  const [bccVisible, setBccVisible] = useState(false);

  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!composeDraft) return null;

  const handleEmailAddressChange = (
    field: 'to' | 'cc' | 'bcc', 
    value: string
  ) => {
    // Simple email parsing - in a real app, you'd want more sophisticated parsing
    const emails = value.split(',').map(email => {
      const trimmed = email.trim();
      const match = trimmed.match(/^(.+?)\s*<(.+)>$/) || trimmed.match(/^(.+)$/);
      if (!match) return null;
      
      if (match.length === 3) {
        return { name: match[1].trim(), email: match[2].trim() } as EmailAddress;
      } else {
        return { email: match[1].trim() } as EmailAddress;
      }
    }).filter(Boolean) as EmailAddress[];

    updateCompose({ [field]: emails });
  };

  const handleSend = async () => {
    if (!composeDraft.to.length || !composeDraft.subject.trim() || !composeDraft.body.trim()) {
      return;
    }

    try {
      await sendEmail(composeDraft);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const formatEmailAddresses = (addresses: EmailAddress[]) => {
    return addresses.map(addr => addr.name ? `${addr.name} <${addr.email}>` : addr.email).join(', ');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-64 bg-[var(--bg-primary)] border border-border-subtle rounded-t-lg shadow-lg z-50">
        <div className="flex items-center justify-between p-3 border-b border-border-subtle">
          <Text size="sm" weight="medium" className="text-primary truncate">
            {composeDraft.subject || 'New Message'}
          </Text>
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
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'bottom-0 right-4 w-[600px] h-[500px]'} bg-[var(--bg-primary)] border border-border-subtle ${isFullscreen ? '' : 'rounded-t-lg'} shadow-xl z-50 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle bg-[var(--bg-secondary)]">
        <Text size="sm" weight="medium" className="text-primary">
          New Message
        </Text>
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
              value={formatEmailAddresses(composeDraft.to)}
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
                value={formatEmailAddresses(composeDraft.cc || [])}
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
                value={formatEmailAddresses(composeDraft.bcc || [])}
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
              value={composeDraft.subject}
              onChange={(e) => updateCompose({ subject: e.target.value })}
              placeholder="Subject"
              className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder-secondary"
            />
          </div>
        </div>

        {/* Message Body */}
        <div className="flex-1 p-3">
          <textarea
            ref={bodyTextareaRef}
            value={composeDraft.body}
            onChange={(e) => updateCompose({ body: e.target.value })}
            placeholder="Compose email"
            className="w-full h-full bg-transparent border-none outline-none text-sm text-primary placeholder-secondary resize-none"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSend}
                disabled={isSending || !composeDraft.to.length || !composeDraft.subject.trim() || !composeDraft.body.trim()}
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
        </div>
      </div>
    </div>
  );
} 