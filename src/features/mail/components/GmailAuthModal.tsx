import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useGmailAuth } from '../hooks/useGmailAuth';
import { GmailAccount } from '../types';
import { useMailStore } from '../stores/mailStore';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (account: GmailAccount) => void;
  allowMultipleAccounts?: boolean;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  allowMultipleAccounts = true,
}) => {
  const {
    isAuthenticated,
    isLoading,
    accounts,
    currentAccount,
    error,
    startAuth,
    completeAuth,
    addAccount,
    removeAccount,
    switchAccount,
    clearError,
  } = useGmailAuth();

  const [authStep, setAuthStep] = useState<'intro' | 'auth' | 'success' | 'manage'>('intro');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [isCompletingAuth, setIsCompletingAuth] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentAccount) {
      setAuthStep('success');
      if (onSuccess) {
        onSuccess(currentAccount);
      }
    }
  }, [isAuthenticated, currentAccount, onSuccess]);

  useEffect(() => {
    if (error) {
      setAuthStep('intro');
    }
  }, [error]);

  if (!isOpen) return null;

  const handleStartAuth = async () => {
    setAuthStep('auth');
    clearError();
    await startAuth();
  };

  const handleAddAccount = async () => {
    setAuthStep('auth');
    clearError();
    await addAccount();
  };

  const handleRemoveAccount = async (accountId: string) => {
    await removeAccount(accountId);
    if (accounts.length <= 1) {
      setAuthStep('intro');
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    switchAccount(accountId);
    setSelectedAccount(accountId);
  };

  const handleClose = () => {
    clearError();
    setAuthStep('intro');
    setAuthCode('');
    setIsCompletingAuth(false);
    onClose();
  };

  const handleCompleteAuth = async () => {
    if (!authCode.trim()) {
      alert('Please enter the authorization code');
      return;
    }

    setIsCompletingAuth(true);
    try {
      await completeAuth(authCode.trim(), '');
    } catch (err) {
      console.error('Failed to complete auth:', err);
    } finally {
      setIsCompletingAuth(false);
    }
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your Gmail Account
        </h3>
        <p className="text-gray-600 text-sm">
          Access your Gmail messages securely with OAuth2 authentication
        </p>
      </div>

      {accounts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Connected Accounts</h4>
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentAccount?.id === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSwitchAccount(account.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {account.avatar ? (
                      <img
                        src={account.avatar}
                        alt={account.displayName || account.email}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent-primary text-white flex items-center justify-center text-xs">
                        {(account.displayName || account.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-primary">
                        {account.displayName || account.email}
                      </div>
                      <p className="text-xs text-gray-500">{account.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentAccount?.id === account.id && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAccount(account.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Secure OAuth2 authentication</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Multi-account support</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={accounts.length > 0 ? handleAddAccount : handleStartAuth}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          <span>
            {accounts.length > 0 ? 'Add Account' : 'Connect Gmail'}
          </span>
        </button>
      </div>
    </div>
  );

  const renderAuthStep = () => (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Complete Gmail Authentication
          </h3>
          <p className="text-gray-600 text-sm">
            A browser window should have opened. After you sign in, Google will show you an authorization code.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="auth-code" className="block text-sm font-medium text-gray-700">
              Authorization Code
            </label>
            <input
              id="auth-code"
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Paste the authorization code here"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCompletingAuth}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secure OAuth2 authentication</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>Copy the code from your browser</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isCompletingAuth}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteAuth}
            disabled={!authCode.trim() || isCompletingAuth}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCompletingAuth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isCompletingAuth ? 'Completing...' : 'Complete Authentication'}
            </span>
          </button>
        </div>
      </div>
    );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Successfully Connected!
      </h3>
      <p className="text-gray-600 text-sm">
        Your Gmail account has been connected and is ready to use.
      </p>

      {currentAccount && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center space-x-3">
            {currentAccount.avatar ? (
              <img
                src={currentAccount.avatar}
                alt={currentAccount.displayName || currentAccount.email}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center text-sm">
                {(currentAccount.displayName || currentAccount.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-primary">
                {currentAccount.displayName || currentAccount.email}
              </div>
              <p className="text-xs text-green-700">{currentAccount.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        {allowMultipleAccounts && (
          <button
            onClick={handleAddAccount}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add Another Account
          </button>
        )}
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (authStep) {
      case 'auth':
        return renderAuthStep();
      case 'success':
        return renderSuccessStep();
      case 'intro':
      default:
        return renderIntroStep();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        role="dialog" 
        aria-labelledby="gmail-auth-title"
        aria-modal="true"
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="gmail-auth-title" className="text-xl font-semibold text-gray-900">Gmail Authentication</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderCurrentStep()}
      </div>
    </div>
  );
}; 