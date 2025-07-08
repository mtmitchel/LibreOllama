import React, { useState } from 'react';
import { useMailStore } from '../stores/mailStore';
import { useGmailSync } from '../hooks/useGmailSync';
import { GmailAccount } from '../types';
import { ErrorDisplay } from './ErrorDisplay';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface AccountSwitcherProps {
  className?: string;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  
  const {
    accounts: accountsObject,
    currentAccountId,
    isLoadingAccounts,
    error,
    switchAccount,
    addAccount,
    removeAccount,
    refreshAccount,
    syncAllAccounts,
    clearError,
    getAccountsArray,
  } = useMailStore();

  const accounts = getAccountsArray();

  const {
    isOnline,
    overallStatus,
    syncAllAccounts: syncServiceSyncAll,
    isAccountSyncing,
    hasAccountError,
    hasPendingOperations,
  } = useGmailSync();

  const currentAccount = accounts.find(acc => acc.id === currentAccountId);

  const handleAccountSwitch = (accountId: string) => {
    switchAccount(accountId);
    setIsOpen(false);
  };

  const handleAddAccount = async () => {
    setIsOpen(false);
    await addAccount();
  };

  const handleRemoveAccount = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this account?')) {
      await removeAccount(accountId);
    }
  };

  const handleRefreshAccount = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshAccount(accountId);
  };

  const handleSyncAll = async () => {
    try {
      await syncServiceSyncAll();
    } catch (error) {
      console.error('Failed to sync all accounts:', error);
    }
  };

  const formatQuota = (account: GmailAccount) => {
    if (!account.quota) return '';
    const usedGB = (account.quota.used / 1024 / 1024 / 1024).toFixed(1);
    const totalGB = (account.quota.total / 1024 / 1024 / 1024).toFixed(0);
    const percentage = ((account.quota.used / account.quota.total) * 100).toFixed(0);
    return `${usedGB}GB / ${totalGB}GB (${percentage}%)`;
  };

  const getStatusColor = (accountId: string) => {
    if (!isOnline) return 'bg-gray-500';
    if (isAccountSyncing(accountId)) return 'bg-blue-500 animate-pulse';
    if (hasAccountError(accountId)) return 'bg-red-500';
    if (hasPendingOperations(accountId)) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (accountId: string) => {
    if (!isOnline) return 'Offline';
    if (isAccountSyncing(accountId)) return 'Syncing...';
    if (hasAccountError(accountId)) return 'Error';
    if (hasPendingOperations(accountId)) return 'Pending operations';
    return 'Connected';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Account Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
        disabled={isLoadingAccounts}
      >
        <div className="relative">
          <img
            src={currentAccount?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAccount?.name || 'User')}&size=32&background=random`}
            alt={currentAccount?.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(currentAccount?.id || '')}`}></div>
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {currentAccount?.name || 'No Account'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentAccount?.email || 'Not connected'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isLoadingAccounts && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Accounts ({accounts.length})</span>
              <button
                onClick={handleSyncAll}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs"
                disabled={isLoadingAccounts || overallStatus.syncingAccounts > 0}
              >
                {overallStatus.syncingAccounts > 0 ? 'Syncing...' : 'Sync All'}
              </button>
            </div>
            
            {/* Account List */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {accounts.map(account => (
                <div
                  key={account.id}
                  onClick={() => handleAccountSwitch(account.id)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    account.id === currentAccountId ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      src={account.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name || 'User')}&size=32&background=random`}
                      alt={account.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(account.id)}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {account.name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {account.email}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {getStatusText(account.id)}
                      {account.lastSync && (
                        <span className="ml-1">
                          • {new Date(account.lastSync).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleRefreshAccount(account.id, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      title="Refresh account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={(e) => handleRemoveAccount(account.id, e)}
                        className="p-1 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
                        title="Remove account"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Account Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <button
                onClick={handleAddAccount}
                className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                disabled={isLoadingAccounts}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Account</span>
              </button>
            </div>

            {/* Manage Accounts Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <button
                onClick={() => {
                  setShowManageModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Manage Accounts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <ErrorDisplay
            error={error}
            onRetry={clearError}
            compact={true}
          />
        </div>
      )}

      {/* Manage Accounts Modal */}
      {showManageModal && (
        <AccountManageModal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
        />
      )}
    </div>
  );
};

// Account Management Modal Component
interface AccountManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountManageModal: React.FC<AccountManageModalProps> = ({ isOpen, onClose }) => {
  const {
    accounts: accountsObject,
    currentAccountId,
    isLoadingAccounts,
    error,
    addAccount,
    removeAccount,
    refreshAccount,
    syncAllAccounts,
    clearError,
    getAccountsArray,
  } = useMailStore();

  const accounts = getAccountsArray();

  const formatQuota = (account: GmailAccount) => {
    if (!account.quota) return 'Unknown';
    const usedGB = (account.quota.used / 1024 / 1024 / 1024).toFixed(1);
    const totalGB = (account.quota.total / 1024 / 1024 / 1024).toFixed(0);
    const percentage = ((account.quota.used / account.quota.total) * 100).toFixed(0);
    return `${usedGB}GB / ${totalGB}GB (${percentage}%)`;
  };

  const getStatusColor = (status: GmailAccount['syncStatus']) => {
    switch (status) {
      case 'idle': return 'text-green-600 dark:text-green-400';
      case 'syncing': return 'text-blue-600 dark:text-blue-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'offline': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to remove this account? This will delete all local data for this account.')) {
      await removeAccount(accountId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Manage Gmail Accounts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={syncAllAccounts}
                disabled={isLoadingAccounts}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              >
                {isLoadingAccounts ? 'Syncing...' : 'Sync All'}
              </button>
              <button
                onClick={addAccount}
                disabled={isLoadingAccounts}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Add Account
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <ErrorDisplay
                error={error}
                onRetry={clearError}
                compact={false}
              />
            </div>
          )}

          {/* Account List */}
          <div className="space-y-4">
            {accounts.map(account => (
              <div
                key={account.id}
                className={`p-4 rounded-lg border transition-colors ${
                  account.id === currentAccountId
                    ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={account.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name || 'User')}&size=48&background=random`}
                      alt={account.name || 'User'}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {account.name || 'Unknown User'}
                        {account.id === currentAccountId && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{account.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`flex items-center ${getStatusColor(account.syncStatus)}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            account.syncStatus === 'idle' ? 'bg-green-500' :
                            account.syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                            account.syncStatus === 'error' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          {account.syncStatus === 'idle' ? 'Connected' :
                           account.syncStatus === 'syncing' ? 'Syncing...' :
                           account.syncStatus === 'error' ? 'Error' :
                           'Offline'}
                        </span>
                        <span>Storage: {formatQuota(account)}</span>
                        {account.lastSync && (
                          <span>
                            Last sync: {new Date(account.lastSync).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => refreshAccount(account.id)}
                      disabled={isLoadingAccounts}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                      title="Refresh account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => handleRemoveAccount(account.id)}
                        disabled={isLoadingAccounts}
                        className="p-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Remove account"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 