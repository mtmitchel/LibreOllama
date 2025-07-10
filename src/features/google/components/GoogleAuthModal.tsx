import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
  description = "Sign in to your Google account to sync your calendar and tasks",
  icon = <Calendar size={24} className="text-[var(--accent-primary)]" />,
  isInlineModal = false
}: GoogleAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'url-display' | 'code-entry'>('initial');

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
      setOauthUrl(null);
      setAuthState(null);
      setAuthCode('');
    }
  }, [isOpen]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [GOOGLE] Starting OAuth flow with scopes:', scopes);
      console.log('🔐 [GOOGLE] Invoking Tauri command: start_gmail_oauth');
      
      // Add timeout to the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
      );
      
      // Step 1: Start OAuth flow - get authorization URL  
      const authRequestPromise = invoke('start_gmail_oauth', {
        config: {
          redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
        }
      }).then(result => {
        console.log('🔐 [GOOGLE] Tauri command returned:', result);
        return result;
      }).catch(err => {
        console.error('🔐 [GOOGLE] Tauri command error:', err);
        throw err;
      });

      const authRequest = await Promise.race([authRequestPromise, timeoutPromise]) as { auth_url: string; state: string };

      console.log('🔗 [GOOGLE] Authorization URL generated:', authRequest.auth_url);

      // Step 2: Show URL in modal
      setOauthUrl(authRequest.auth_url);
      setAuthState(authRequest.state);
      setStep('url-display');
      setIsLoading(false);

    } catch (err) {
      console.error('❌ [GOOGLE] Authentication failed:', err);
      let errorMessage = 'Authentication failed';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide specific help for common issues
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. The Tauri backend may not be responding. Check the console for details.';
        } else if (err.message.includes('not found') || err.message.includes('command')) {
          errorMessage = 'Google OAuth commands not available. Please ensure the Tauri backend is running with Gmail support.';
        } else if (err.message.includes('OAuth') || err.message.includes('client')) {
          errorMessage = 'OAuth configuration error. Please check that GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set in your environment.';
        } else if (err.message.includes('database') || err.message.includes('storage')) {
          errorMessage = 'Database error. Please ensure the database is properly initialized.';
        }
      }
      
      setError(errorMessage);
      setStep('initial'); // Go back to initial state so user can try again
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (authorizationCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('✅ [GOOGLE] Received authorization code, completing OAuth...');

      // Complete OAuth flow with authorization code
      const tokenResponse = await invoke('complete_gmail_oauth', {
        code: authorizationCode.trim(),
        state: authState,
        redirectUri: 'urn:ietf:wg:oauth:2.0:oob'
      }) as { 
        access_token: string; 
        refresh_token: string; 
        expires_in: number;
        token_type: string;
      };

      console.log('🎯 [GOOGLE] Tokens received, getting user info...');

      // Get user information
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

    } catch (err) {
      console.error('❌ [GOOGLE] Authentication failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleNext = () => {
    setStep('code-entry');
  };

  const handleBack = () => {
    setStep('url-display');
  };

  const [authCode, setAuthCode] = useState('');

  if (!isOpen) return null;

  const modalContent = (
    <Card className="w-full max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <Heading level={3}>
              {step === 'initial' ? title : 
               step === 'url-display' ? 'Step 1: Open Google Authentication' :
               'Step 2: Enter Authorization Code'}
            </Heading>
          </div>
          {!isLoading && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'initial' && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'url-display' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--success)] text-white'
            }`}>
              1
            </div>
            <div className={`h-1 flex-1 rounded ${
              step === 'code-entry' ? 'bg-[var(--success)]' : 'bg-[var(--bg-tertiary)]'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'code-entry' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}>
              2
            </div>
          </div>
        )}

        {/* Content based on step */}
        {step === 'initial' && (
          <>
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
          </>
        )}

        {step === 'url-display' && (
          <div className="space-y-4">
            {oauthUrl ? (
              <>
                <Text variant="secondary">
                  Copy the URL below and open it in your browser to sign in with Google:
                </Text>
                
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border">
                  <Text size="sm" className="break-all font-mono">{oauthUrl}</Text>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(oauthUrl)}
                  className="w-full"
                >
                  Copy URL to Clipboard
                </Button>
                
                <Text size="sm" variant="tertiary">
                  After signing in with Google, you'll be redirected to a page that shows "This site can't be reached" - this is normal! 
                  Look for a long authorization code in the URL (after "code=") and copy it to paste in the next step.
                </Text>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <Text variant="secondary">Generating authentication URL...</Text>
              </div>
            )}
          </div>
        )}

        {step === 'code-entry' && (
          <div className="space-y-4">
            <Text variant="secondary">
              Paste the authorization code from your browser here. Look for the long code after "code=" in the URL:
            </Text>
            
            <div className="space-y-2">
              <Text size="sm" weight="medium">Authorization Code</Text>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="w-full p-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)]"
                placeholder="Paste authorization code here..."
              />
            </div>
          </div>
        )}

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
          {step === 'initial' && (
            <>
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
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={16} />
                    Start Authentication
                  </div>
                )}
              </Button>
            </>
          )}
          
          {step === 'url-display' && (
            <>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              {oauthUrl ? (
                <Button 
                  variant="primary" 
                  onClick={handleNext}
                  className="flex-1"
                >
                  I've Opened the URL
                </Button>
              ) : error ? (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setStep('initial');
                    setError(null);
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  disabled
                  className="flex-1"
                >
                  Generating URL...
                </Button>
              )}
            </>
          )}
          
          {step === 'code-entry' && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={() => handleCodeSubmit(authCode)}
                disabled={isLoading || !authCode.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  'Complete Authentication'
                )}
              </Button>
            </>
          )}
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