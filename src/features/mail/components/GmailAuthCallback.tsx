import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { useGmailAuth } from '../hooks/useGmailAuth';

interface GmailAuthCallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export const GmailAuthCallback: React.FC<GmailAuthCallbackProps> = ({
  onSuccess,
  onError,
  redirectTo = '/mail',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeAuth, error, isLoading, clearError } = useGmailAuth();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setStatus('processing');
        clearError();

        // Extract parameters from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth error responses
        if (error) {
          const message = errorDescription || error || 'Authentication failed';
          setErrorMessage(message);
          setStatus('error');
          if (onError) {
            onError(message);
          }
          return;
        }

        // Validate authorization code
        if (!code) {
          const message = 'Authorization code not found in callback URL';
          setErrorMessage(message);
          setStatus('error');
          if (onError) {
            onError(message);
          }
          return;
        }

        // Complete authentication with the authorization code
        await completeAuth(code);
        
        setStatus('success');
        if (onSuccess) {
          onSuccess();
        }

        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 2000);

      } catch (err) {
        console.error('Gmail auth callback error:', err);
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setErrorMessage(message);
        setStatus('error');
        if (onError) {
          onError(message);
        }
      }
    };

    processCallback();
  }, [searchParams, completeAuth, navigate, redirectTo, onSuccess, onError, clearError]);

  // Also handle errors from the useGmailAuth hook
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setStatus('error');
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  const handleRetry = () => {
    clearError();
    setErrorMessage(null);
    navigate('/mail', { replace: true });
  };

  const handleGoBack = () => {
    navigate('/mail', { replace: true });
  };

  const renderProcessing = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        Completing Authentication
      </h2>
      <p className="text-gray-600">
        Processing your Gmail authentication...
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Exchanging authorization code</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
          <span>Retrieving account information</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
          <span>Securing access tokens</span>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        Authentication Successful!
      </h2>
      <p className="text-gray-600">
        Your Gmail account has been successfully connected.
      </p>
      <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
        <Mail className="w-4 h-4" />
        <span>Redirecting to your mailbox...</span>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        Authentication Failed
      </h2>
      <p className="text-gray-600">
        There was a problem connecting your Gmail account.
      </p>
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      <div className="flex space-x-3 justify-center">
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  const renderCurrentStatus = () => {
    switch (status) {
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      case 'processing':
      default:
        return renderProcessing();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            <span>Gmail Authentication</span>
          </div>
        </div>
        
        {renderCurrentStatus()}
      </div>
    </div>
  );
};

// Hook for easier integration in other components
export const useGmailAuthCallback = () => {
  const navigate = useNavigate();
  
  const handleCallback = (code: string) => {
    // Navigate to callback page with the code
    navigate(`/auth/gmail/callback?code=${encodeURIComponent(code)}`, { replace: true });
  };

  return { handleCallback };
}; 