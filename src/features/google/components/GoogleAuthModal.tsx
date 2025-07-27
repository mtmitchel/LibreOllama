import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Card, Button, Text, Heading } from '../../../components/ui';
import { getSecureAuthHandler } from '../services/SecureAuthHandler';
import { logger } from '../../../core/lib/logger';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (accountData: {
    id: string;
    email: string;
    name: string;
    picture: string;
  }) => void;
  scopes?: string[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  isInlineModal?: boolean;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  isInlineModal 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'ready' | 'browser' | 'processing' | 'success' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);

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
      setAuthStep('ready');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);


  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthStep('browser');
    setError(null);

    try {
      logger.info('[GoogleAuthModal] Starting secure OAuth 2.0 PKCE flow');
      
      // Show browser state while backend handles OAuth
      // The backend will open the browser and wait for the callback
      
      // Use the secure authentication handler with PKCE flow
      const authHandler = getSecureAuthHandler();
      
      // This call will block until the OAuth flow is complete
      const accountData = await authHandler.authenticateUser();
      
      logger.info('[GoogleAuthModal] Authentication successful', { 
        accountId: accountData.accountId,
        email: accountData.email 
      });
      
      // Transition to processing, then success
      setAuthStep('processing');
      
      // Give a moment for the processing state to show
      setTimeout(() => {
        setAuthStep('success');
        
        // Notify parent component of successful authentication
        if (onSuccess) {
          onSuccess({
            id: accountData.accountId,
            email: accountData.email,
            name: accountData.name,
            picture: accountData.picture
          });
        }

        // Auto-close modal after brief success display
        setTimeout(() => {
          onClose();
        }, 2000);
      }, 1500);

      setIsLoading(false);

    } catch (err) {
      logger.error('[GoogleAuthModal] Authentication failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setAuthStep('error');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderModalContent = () => {
    const googleIcon = (
      <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );

    switch (authStep) {
      case 'ready':
        return (
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="mb-6 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                  {googleIcon}
                </div>
                <Heading level={3} className="mb-2">Connect Google Account</Heading>
                <Text variant="secondary" size="sm" className="mb-6">
                  Sign in to sync your Gmail, Calendar, and Tasks with LibreOllama
                </Text>
              </div>
              
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                  <div className="size-2 rounded-full bg-green-500"></div>
                  <Text size="sm">Gmail - Email management</Text>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                  <div className="size-2 rounded-full bg-blue-500"></div>
                  <Text size="sm">Calendar - Schedule management</Text>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
                  <div className="size-2 rounded-full bg-purple-500"></div>
                  <Text size="sm">Tasks - Task management</Text>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleGoogleAuth}
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Starting...' : 'Connect Google Account'}
                </Button>
                <Text size="xs" variant="secondary" className="text-center">
                  You&apos;ll be redirected to Google to authorize this application
                </Text>
              </div>
            </div>
          </Card>
        );

      case 'browser':
        return (
          <Card className="w-full max-w-lg">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="size-8 animate-pulse text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <Heading level={3} className="mb-2">Complete Authentication in Browser</Heading>
              <Text variant="secondary" size="sm" className="mb-4">
                A new browser window has opened. Please complete the Google authentication process and return to this window.
              </Text>
              <div className="flex items-center justify-center gap-2">
                <div className="size-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
                <div className="size-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
                <div className="size-2 animate-bounce rounded-full bg-blue-500"></div>
              </div>
            </div>
          </Card>
        );

      case 'processing':
        return (
          <Card className="w-full max-w-lg">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="size-8 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <Heading level={3} className="mb-2">Finalizing Authentication</Heading>
              <Text variant="secondary" size="sm" className="mb-4">
                We received your authorization. Setting up your account...
              </Text>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <div className="size-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <Text size="sm">Exchanging authorization code</Text>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <div className="size-2 rounded-full bg-blue-500 animate-pulse animation-delay-150"></div>
                  <Text size="sm">Fetching account details</Text>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <div className="size-2 rounded-full bg-blue-500 animate-pulse animation-delay-300"></div>
                  <Text size="sm">Securing your credentials</Text>
                </div>
              </div>
            </div>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-lg">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
                <svg className="size-8 text-green-600 animate-scale-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Heading level={3} className="mb-2">Account Connected!</Heading>
              <Text variant="secondary" size="sm" className="mb-4">
                Your Google account has been successfully linked.
              </Text>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-success">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <Text size="sm">Gmail access granted</Text>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-success">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <Text size="sm">Calendar access granted</Text>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-success">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <Text size="sm">Tasks access granted</Text>
                </div>
              </div>
              <Text size="xs" variant="secondary">
                Closing in a moment...
              </Text>
            </div>
          </Card>
        );

      case 'error':
        return (
          <Card className="w-full max-w-lg">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <svg className="size-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <Heading level={3} className="mb-2">Authentication Failed</Heading>
              <Text variant="secondary" size="sm" className="mb-4">
                {error || 'There was a problem connecting your Google account.'}
              </Text>
              <div className="space-y-2">
                <Button 
                  onClick={handleGoogleAuth}
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  Try Again
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  const modalContent = renderModalContent();

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