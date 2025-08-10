import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Paperclip, Image, Bold, Italic, Link } from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { ParsedEmail } from '../types';
import { useMailStore } from '../stores/mailStore';

interface InlineReplyProps {
  originalMessage: ParsedEmail;
  replyType: 'reply' | 'reply_all' | 'forward';
  onClose: () => void;
}

export function InlineReply({ originalMessage, replyType, onClose }: InlineReplyProps) {
  const { sendEmail } = useMailStore();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Set up initial values based on reply type
    if (replyType === 'reply') {
      setTo(originalMessage.from.email);
      setSubject(originalMessage.subject.startsWith('Re: ') 
        ? originalMessage.subject 
        : `Re: ${originalMessage.subject}`);
    } else if (replyType === 'reply_all') {
      const allRecipients = [
        originalMessage.from,
        ...originalMessage.to.filter(addr => addr.email !== 'me'), // Filter out self
        ...(originalMessage.cc || [])
      ];
      setTo(allRecipients.map(addr => addr.email).join(', '));
      setSubject(originalMessage.subject.startsWith('Re: ') 
        ? originalMessage.subject 
        : `Re: ${originalMessage.subject}`);
    } else if (replyType === 'forward') {
      setSubject(originalMessage.subject.startsWith('Fwd: ') 
        ? originalMessage.subject 
        : `Fwd: ${originalMessage.subject}`);
      setBody(`\n\n---------- Forwarded message ---------\nFrom: ${originalMessage.from.name || originalMessage.from.email}\nDate: ${originalMessage.date.toLocaleString()}\nSubject: ${originalMessage.subject}\nTo: ${originalMessage.to.map(addr => addr.email).join(', ')}\n\n${originalMessage.body}`);
    }

    // Focus on appropriate field
    if (replyType === 'forward') {
      // Focus on To field for forward
      setTimeout(() => {
        const toInput = document.querySelector('input[name="to"]') as HTMLInputElement;
        toInput?.focus();
      }, 100);
    } else {
      // Focus on body for reply
      setTimeout(() => {
        bodyRef.current?.focus();
      }, 100);
    }
  }, [originalMessage, replyType]);

  const handleSend = async () => {
    if (!to.trim() || !body.trim()) return;

    setIsSending(true);
    try {
      // TODO: Implement actual send functionality
      console.log('Sending email:', { to, cc, subject, body });
      
      // Simulate send delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close the reply section
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-border-default border-t bg-gray-50">
      {/* Reply Header */}
      <div className="border-border-default flex items-center justify-between border-b bg-white px-4 py-2">
        <Text size="sm" weight="medium" className="text-primary">
          {replyType === 'reply' ? 'Reply' : replyType === 'reply_all' ? 'Reply all' : 'Forward'}
        </Text>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-secondary hover:text-primary"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Reply Form */}
      <div className="p-4">
        {/* To Field */}
        <div className="mb-3">
          <input
            type="text"
            name="to"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border-border-default w-full rounded-lg border bg-white px-3 py-2 asana-text-sm focus:border-accent-primary focus:outline-none"
          />
        </div>

        {/* CC Field - Collapsible */}
        {cc && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Cc"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="border-border-default w-full rounded-lg border bg-white px-3 py-2 asana-text-sm focus:border-accent-primary focus:outline-none"
            />
          </div>
        )}

        {/* Subject Field */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-border-default w-full rounded-lg border bg-white px-3 py-2 asana-text-sm focus:border-accent-primary focus:outline-none"
          />
        </div>

        {/* Body Field */}
        <div className="mb-3">
          <textarea
            ref={bodyRef}
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="border-border-default min-h-[150px] w-full resize-none rounded-lg border bg-white px-3 py-2 asana-text-sm focus:border-accent-primary focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <Paperclip size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <Image size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <Bold size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <Italic size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <Link size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSend}
              disabled={!to.trim() || !body.trim() || isSending}
            >
              <Send size={16} className="mr-2" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InlineReply;