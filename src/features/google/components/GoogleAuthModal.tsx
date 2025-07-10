import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { Card, Button, Text, Heading } from '../../../components/ui';
import { Calendar, CheckSquare, Mail, X, ExternalLink } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: any) => void;
  scopes?: string[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  isInlineModal?: boolean;
}

export function GoogleAuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks'
  ],
  title = "Connect Google Account",
  description = "Click below to automatically sign in with Google - your browser will open and authentication will complete automatically",
  icon = <Calendar size={24} className="text-[var(--accent-primary)]" />,
  isInlineModal = false
}: GoogleAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string | null>(null);
  const [step, setStep] = useState<'initial'>('initial');

  // Handle escape key and reset state when modal opens/closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setError(null);
      setAuthState(null);
    }
  }, [isOpen]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [GOOGLE] Starting fully automated OAuth flow...');
      
      // Single step: Complete OAuth flow automatically
      const tokenResponse = await invoke('start_gmail_oauth_with_callback') as { 
        access_token: string; 
        refresh_token: string; 
        expires_in: number;
        token_type: string;
      };

      console.log('🎯 [GOOGLE] Tokens received automatically!');
      
      // Get user information and store account
      const userInfo = await invoke('get_gmail_user_info', {
        accessToken: tokenResponse.access_token
      }) as {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };

      console.log('👤 [GOOGLE] User info retrieved:', userInfo);

      // Store tokens securely
      const accountId = `google-${userInfo.id}`;
      await invoke('store_gmail_tokens_secure', {
        accountId,
        tokens: {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_in: tokenResponse.expires_in.toString(),
          token_type: tokenResponse.token_type,
          expires_at: (Date.now() + (tokenResponse.expires_in * 1000)).toString()
        },
        userInfo
      });

      console.log('💾 [GOOGLE] Account stored successfully');

      // Return account data to parent component
      const accountData = {
        id: accountId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/drive.metadata.readonly'
        ]
      };

      onSuccess(accountData);
      setIsLoading(false);

    } catch (err) {
      console.error('❌ [GOOGLE] Authentication failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsLoading(false);
    }
  };





  if (!isOpen) return null;

  const modalContent = (
    <Card className="w-full max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <Heading level={3}>{title}</Heading>
          </div>
          {!isLoading && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          )}
        </div>

        {/* Content */}
        <Text variant="secondary" className="mb-6">
          {description}
        </Text>

        {/* Benefits */}
        <div className="mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <Mail size={16} className="text-[var(--success)] mt-0.5" />
            <div>
              <Text size="sm" weight="medium">Gmail Integration</Text>
              <Text size="xs" variant="tertiary">
                Access your emails, compose messages, and manage your inbox
              </Text>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-[var(--success)] mt-0.5" />
            <div>
              <Text size="sm" weight="medium">Calendar Integration</Text>
              <Text size="xs" variant="tertiary">
                Sync events, create meetings, and manage your schedule
              </Text>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckSquare size={16} className="text-[var(--success)] mt-0.5" />
            <div>
              <Text size="sm" weight="medium">Task Management</Text>
              <Text size="xs" variant="tertiary">
                Access your Google Tasks and keep everything organized
              </Text>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-[var(--error-ghost)] border border-[var(--error)] rounded-md">
            <Text size="sm" className="text-[var(--error)]">
              {error}
            </Text>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ExternalLink size={16} />
                Connect Google Account
              </div>
            )}
          </Button>
        </div>

        {/* Privacy Note */}
        <Text size="xs" variant="tertiary" className="mt-4 text-center">
          Your data is securely handled and we only access what's needed for the features you use.
        </Text>
      </div>
    </Card>
  );

  // If used as inline modal, just return the content
  if (isInlineModal) {
    return modalContent;
  }

  // Default full-screen modal with backdrop
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {modalContent}
    </div>
  );
} 