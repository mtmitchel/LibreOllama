import React, { useEffect, useState } from 'react';
import { useGmailAuth } from '../hooks/useGmailAuth';
import { useMailStore } from '../stores/mailStore';

export const GmailAuthCallback: React.FC = () => {
  const { completeAuth, error } = useGmailAuth();
  const expectedState = useMailStore((s) => s.authState);
  const [isProcessing, setIsProcessing] = useState(true);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ received?: string | null; expected?: string | null }>({});

  // Debug: Log the store state on component mount
  React.useEffect(() => {
    console.log('🔍 [DEBUG] GmailAuthCallback mounted. Expected state from store:', expectedState);
    console.log('🔍 [DEBUG] Current localStorage gmail-auth-storage:', localStorage.getItem('gmail-auth-storage'));
  }, [expectedState]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        setCallbackError(null);

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const receivedState = urlParams.get('state');

        // --- Enhanced State Validation ---
        console.log('OAuth callback validation:', { 
          received: receivedState, 
          expected: expectedState,
          storeState: useMailStore.getState().authState 
        });
        
        // Try to get state from store directly as fallback
        const storeState = useMailStore.getState().authState;
        const validState = expectedState || storeState;
        
        console.log('Enhanced validation:', { 
          received: receivedState, 
          expectedFromHook: expectedState,
          expectedFromStore: storeState,
          finalExpected: validState
        });
        
        if (!receivedState || !validState || receivedState !== validState) {
          setDebugInfo({ 
            received: receivedState, 
            expected: `Hook: ${expectedState}, Store: ${storeState}` 
          });
          throw new Error('Invalid authentication state. Please try again to protect your security.');
        }
        // --- End State Validation ---

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        // Complete authentication - pass state to hook
        await completeAuth(code, validState);
        console.log('Gmail authentication completed successfully');

        // Show success briefly, then redirect
        setIsProcessing(false);
        
        setTimeout(() => {
          window.location.href = '/mail';
        }, 1500);

      } catch (err) {
        console.error('Callback processing failed:', err);
        setCallbackError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
        
        // DO NOT REDIRECT ON ERROR, so we can debug
        // setTimeout(() => {
        //   window.location.href = '/mail';
        // }, 3000);
      }
    };

    handleCallback();
  }, [completeAuth, expectedState]);

  if (callbackError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 6.5c-.77.833-.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">{callbackError}</p>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left text-sm">
            <h3 className="font-semibold text-yellow-800">Debugging Information:</h3>
            <p className="text-yellow-700">
              <span className="font-medium">State from Google:</span> {debugInfo.received || 'Not found'}
            </p>
            <p className="text-yellow-700">
              <span className="font-medium">State expected (from store):</span> {debugInfo.expected || 'Not found'}
            </p>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Please copy this information and share it for assistance.
          </p>
          
          <button 
            onClick={() => {
              console.log('🔧 [DEBUG] Clearing auth state and retrying...');
              useMailStore.getState().setAuthState(null);
              window.location.href = '/mail';
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear Auth State & Return to Mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center max-w-md mx-auto">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Completing Authentication...
            </h2>
            <p className="text-gray-600">
              Processing your Gmail authentication with Google's servers.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600">
              Your Gmail account has been connected. Redirecting to your mailbox...
            </p>
          </>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">Warning: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 