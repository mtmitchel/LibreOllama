import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, Button, Text, Heading } from '../../../components/ui';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  scopes?: string[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  isInlineModal?: boolean;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, isInlineModal }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handle escape key and reset state when modal opens/closes
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (isOpen) {
      //
    }
  }, [isOpen]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);

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
      // const accountData = { ... }; // Unused

      // onSuccess(accountData); // This line was removed from the new_code, so it's removed here.
      setIsLoading(false);

    } catch (err) {
      console.error('❌ [GOOGLE] Authentication failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      //
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <Card className="w-full max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <Heading level={3}>Google Authentication</Heading>
              <Text variant="secondary" size="sm">
                Connect your Google account to access Gmail, Calendar, and Tasks
              </Text>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="size-2 bg-green-500 rounded-full"></div>
              <Text size="sm">Gmail - Email management</Text>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="size-2 bg-blue-500 rounded-full"></div>
              <Text size="sm">Calendar - Schedule management</Text>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="size-2 bg-purple-500 rounded-full"></div>
              <Text size="sm">Tasks - Task management</Text>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              onClick={handleGoogleAuth}
              variant="primary"
              className="w-full"
            >
              Connect Google Account
            </Button>
            <Text size="xs" variant="secondary" className="text-center mt-2">
              You&apos;ll be redirected to Google to authorize this application
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );

  // If used as inline modal, just return the content
  if (isInlineModal) {
    return modalContent;
  }

  // Default full-screen modal with backdrop
  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      {modalContent}
    </div>
  );
} 