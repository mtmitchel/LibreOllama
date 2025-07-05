import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useGmailAuth, GmailAccount } from '../hooks/useGmailAuth';

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
    addAccount,
    removeAccount,
    switchAccount,
    clearError,
  } = useGmailAuth();

  const [authStep, setAuthStep] = useState<'intro' | 'auth' | 'success' | 'manage'>('intro');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

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
    onClose();
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
                    {account.picture ? (
                      <img
                        src={account.picture}
                        alt={account.name || account.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.name || account.email}
                      </p>
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
    <div className="space-y-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Authenticating with Gmail
      </h3>
      <p className="text-gray-600 text-sm">
        Please complete the authentication in your browser. You can return to this window once done.
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>Secure connection established</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>Requesting Gmail access permissions</span>
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

      <button
        onClick={handleClose}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
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
            {currentAccount.picture ? (
              <img
                src={currentAccount.picture}
                alt={currentAccount.name || currentAccount.email}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-green-300 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-700" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-green-900">
                {currentAccount.name || currentAccount.email}
              </p>
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Gmail Authentication</h2>
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