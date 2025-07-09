import React, { useState, useEffect } from 'react';
import { useGmailSync } from '../hooks/useGmailSync';
import { useMailStore } from '../stores/mailStore';
import { SyncEvent, SyncEventType } from '../services/gmailSyncService';

interface SyncStatusIndicatorProps {
  accountId?: string; // If provided, shows status for specific account
  compact?: boolean; // Compact mode for toolbars
  showControls?: boolean; // Whether to show sync controls
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  accountId,
  compact = false,
  showControls = true,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [recentEvents, setRecentEvents] = useState<SyncEvent[]>([]);
  
  const {
    isOnline,
    overallStatus,
    accountStates,
    config,
    updateConfig,
    syncAccount,
    syncAllAccounts,
    pauseSync,
    resumeSync,
    getAccountState,
    getLastSyncTime,
    getSyncErrors,
    isAccountSyncing,
    hasAccountError,
    hasPendingOperations,
    addEventListener,
    removeEventListener,
  } = useGmailSync();

  const { accounts: accountsObject, getCurrentAccount, getAccountsArray } = useMailStore();
  const accounts = getAccountsArray();

  // Track recent sync events for activity log
  useEffect(() => {
    const handleSyncEvent = (event: SyncEvent) => {
      setRecentEvents(prev => {
        const newEvents = [event, ...prev].slice(0, 10); // Keep last 10 events
        return newEvents;
      });
    };

    const eventTypes: SyncEventType[] = [
      'sync_started',
      'sync_completed',
      'sync_error',
      'new_messages',
      'push_notification_received',
    ];

    eventTypes.forEach(type => {
      addEventListener(type, handleSyncEvent);
    });

    return () => {
      eventTypes.forEach(type => {
        removeEventListener(type, handleSyncEvent);
      });
    };
  }, [addEventListener, removeEventListener]);

  // Get status for specific account or overall
  const targetAccountState = accountId ? getAccountState(accountId) : null;
  const targetAccount = accountId ? accounts.find(acc => acc.id === accountId) : getCurrentAccount();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <OfflineIcon className="w-4 h-4 text-gray-500" />;
    }

    if (accountId) {
      if (isAccountSyncing(accountId)) {
        return <SyncingIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      }
      if (hasAccountError(accountId)) {
        return <ErrorIcon className="w-4 h-4 text-red-500" />;
      }
      if (hasPendingOperations(accountId)) {
        return <PendingIcon className="w-4 h-4 text-yellow-500" />;
      }
      return <IdleIcon className="w-4 h-4 text-green-500" />;
    } else {
      if (overallStatus.syncingAccounts > 0) {
        return <SyncingIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      }
      if (overallStatus.errorAccounts > 0) {
        return <ErrorIcon className="w-4 h-4 text-red-500" />;
      }
      if (overallStatus.pendingOperations > 0) {
        return <PendingIcon className="w-4 h-4 text-yellow-500" />;
      }
      return <IdleIcon className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    if (accountId) {
      if (isAccountSyncing(accountId)) {
        return 'Syncing...';
      }
      if (hasAccountError(accountId)) {
        return 'Sync Error';
      }
      if (hasPendingOperations(accountId)) {
        const count = targetAccountState?.pendingOperations.length || 0;
        return `${count} pending`;
      }
      const lastSync = getLastSyncTime(accountId);
      if (lastSync) {
        return `Last sync: ${formatRelativeTime(lastSync)}`;
      }
      return 'Not synced';
    } else {
      if (overallStatus.syncingAccounts > 0) {
        return `Syncing ${overallStatus.syncingAccounts} account${overallStatus.syncingAccounts !== 1 ? 's' : ''}`;
      }
      if (overallStatus.errorAccounts > 0) {
        return `${overallStatus.errorAccounts} sync error${overallStatus.errorAccounts !== 1 ? 's' : ''}`;
      }
      if (overallStatus.pendingOperations > 0) {
        return `${overallStatus.pendingOperations} pending operation${overallStatus.pendingOperations !== 1 ? 's' : ''}`;
      }
      return `${overallStatus.totalAccounts} account${overallStatus.totalAccounts !== 1 ? 's' : ''} synced`;
    }
  };

  const handleSyncClick = async () => {
    try {
      if (accountId) {
        await syncAccount(accountId, true);
      } else {
        await syncAllAccounts();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handlePauseResume = async () => {
    try {
      const isPaused = targetAccountState?.status === 'paused' || 
                     (accountStates.length > 0 && accountStates.every(s => s.status === 'paused'));
      
      if (isPaused) {
        await resumeSync(accountId);
      } else {
        await pauseSync(accountId);
      }
    } catch (error) {
      console.error('Failed to pause/resume sync:', error);
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title={getStatusText()}
        >
          {getStatusIcon()}
          {!accountId && overallStatus.syncingAccounts > 0 && (
            <span>{overallStatus.syncingAccounts}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {accountId ? `${targetAccount?.displayName || 'Account'} Sync` : 'Email Sync'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getStatusText()}
            </p>
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncClick}
              disabled={!isOnline || (accountId ? isAccountSyncing(accountId) : overallStatus.syncingAccounts > 0)}
              className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accountId ? 'Sync' : 'Sync All'}
            </button>
            
            <button
              onClick={handlePauseResume}
              className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {targetAccountState?.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {accountId ? (targetAccountState ? 1 : 0) : overallStatus.totalAccounts}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Account{(!accountId && overallStatus.totalAccounts !== 1) ? 's' : ''}
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {accountId ? (targetAccountState?.pendingOperations.length || 0) : overallStatus.pendingOperations}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Pending
              </div>
            </div>
          </div>

          {/* Account-specific details */}
          {accountId && targetAccountState && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {targetAccountState.status}
                </span>
              </div>
              
              {targetAccountState.lastSyncTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Sync:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {targetAccountState.lastSyncTime.toLocaleString()}
                  </span>
                </div>
              )}
              
              {targetAccountState.isWatchEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Push Notifications:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Enabled
                  </span>
                </div>
              )}
              
              {targetAccountState.error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Error: {targetAccountState.error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overall stats for all accounts */}
          {!accountId && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Syncing:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {overallStatus.syncingAccounts} account{overallStatus.syncingAccounts !== 1 ? 's' : ''}
                </span>
              </div>
              
              {overallStatus.errorAccounts > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Errors:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {overallStatus.errorAccounts} account{overallStatus.errorAccounts !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Connection:</span>
                <span className={`font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Recent Activity</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{getEventDescription(event)}</span>
                    <span>{formatRelativeTime(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Configuration */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sync Interval:</span>
              <select
                value={config.pollingInterval}
                onChange={(e) => updateConfig({ pollingInterval: parseInt(e.target.value) })}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to describe events
const getEventDescription = (event: SyncEvent): string => {
  switch (event.type) {
    case 'sync_started':
      return event.accountId ? 'Sync started' : 'Bulk sync started';
    case 'sync_completed':
      const newCount = event.data?.newMessages?.length || 0;
      return `Sync completed${newCount > 0 ? ` (${newCount} new)` : ''}`;
    case 'sync_error':
      return 'Sync failed';
    case 'new_messages':
      return `${event.data?.newMessages?.length || 0} new messages`;
    case 'push_notification_received':
      return 'Push notification received';
    default:
      return event.type.replace(/_/g, ' ');
  }
};

// Icon components
const SyncingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IdleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PendingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OfflineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 5.636m-12.728 12.728L5.636 18.364" />
  </svg>
); 