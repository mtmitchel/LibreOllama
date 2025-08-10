import React from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Badge } from '../../../components/ui/design-system/Badge';
import { Text, Caption } from '../../../components/ui';
import { 
  Edit, 
  Inbox, 
  Star, 
  Clock, 
  Send, 
  FileText, 
  Trash2, 
  AlertTriangle,
  Archive,
  ChevronDown,
  ChevronRight,
  Tag,
  Mail,
  PanelLeft,
  PanelRight,
  RefreshCw,
  LogOut,
  ExternalLink,
  Plus,
  Settings
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { GmailAccount } from '../types';
import { useState } from 'react';
import { StreamlinedLabelManager } from './StreamlinedLabelManager';
import { logger } from '../../../core/lib/logger';

interface MailSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

// Separate component for storage info to prevent render crashes
function StorageInfo({
  account,
  onRefresh
}: {
  account: GmailAccount;
  onRefresh: () => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { quotaUsed, quotaTotal } = account;
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };
  
  // Handle different quota scenarios
  if (typeof quotaUsed !== 'number') {
    return (
      <div className="py-2 text-center">
        <Text size="xs" variant="tertiary">
          {isRefreshing ? 'Loading storage info...' : 'Storage info unavailable'}
        </Text>
      </div>
    );
  }

  // Handle unlimited storage (quotaTotal is null, undefined, or 0)
  if (quotaTotal === null || quotaTotal === undefined || quotaTotal === 0) {
    return (
      <div className="py-2 text-center">
        <Text size="xs" variant="secondary">
          Unlimited storage
        </Text>
        <Text size="xs" variant="tertiary" className="mt-1">
          {(quotaUsed / (1024 * 1024 * 1024)).toFixed(1)} GiB used
        </Text>
      </div>
    );
  }

  const usedGiB = (quotaUsed / (1024 * 1024 * 1024)).toFixed(1);
  const totalGiB = (quotaTotal / (1024 * 1024 * 1024)).toFixed(1);
  const percentage = (quotaUsed / quotaTotal) * 100;

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <Text size="xs" weight="semibold" variant="secondary">Storage</Text>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-6"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh storage quota"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" title="Manage storage">
            <ExternalLink size={12} />
          </Button>
        </div>
      </div>
      <Text size="xs" variant="tertiary" className="mb-2">
        {usedGiB} GiB of {totalGiB} GiB used
      </Text>
      <div className="h-1 w-full rounded-full bg-tertiary">
        <div 
          className="h-1 rounded-full bg-accent-primary" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </>
  );
}

export function MailSidebar({ isOpen = true, onToggle }: MailSidebarProps) {
  const { 
    currentView, 
    setCurrentView, 
    startCompose, 
    getLabels, 
    currentLabel, 
    setCurrentLabel,
    fetchLabels,
    currentAccountId,
    isAuthenticated,
    getCurrentAccount,
    refreshAccount,
    signOut
  } = useMailStore();

  const labels = getLabels();
  const activeAccount = getCurrentAccount();

  const [labelsExpanded, setLabelsExpanded] = React.useState(true);
  const [isRefreshingQuota, setIsRefreshingQuota] = React.useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false);
  const [labelManagerMode, setLabelManagerMode] = React.useState<'filter' | 'pick' | 'manage'>('manage');

  // Only fetch labels if we don't have any yet (lazy loading)
  React.useEffect(() => {
    if (isAuthenticated && currentAccountId && labels.length === 0) {
      const currentAccount = getCurrentAccount();
      const hasAuthError = currentAccount?.syncStatus === 'error' && currentAccount?.errorMessage?.includes('Authentication');
      
      // Don't auto-refresh if account has authentication errors
      if (!hasAuthError) {
        logger.debug('🏷️ [SIDEBAR] No labels loaded, fetching for account:', currentAccountId);
        fetchLabels(currentAccountId).catch(error => {
          logger.error('🏷️ [SIDEBAR] Failed to fetch labels:', error);
        });
      } else {
        logger.warn('⚠️ [SIDEBAR] Skipping auto-refresh due to authentication error for account:', currentAccountId);
      }
    }
  }, [isAuthenticated, currentAccountId, fetchLabels, refreshAccount, getCurrentAccount]);

  // Auto-refresh quota if it's missing - but only once per account
  React.useEffect(() => {
    const currentAccount = getCurrentAccount();
    if (currentAccount && currentAccountId && !isRefreshingQuota) {
      const hasQuotaData = typeof currentAccount.quotaUsed !== 'undefined' || typeof currentAccount.quotaTotal !== 'undefined';
      const hasAuthError = currentAccount.syncStatus === 'error' && currentAccount.errorMessage?.includes('Authentication');
      
      // Don't auto-refresh if account has authentication errors
      if (!hasQuotaData && !hasAuthError) {
        logger.debug('🔄 [SIDEBAR] Auto-refreshing missing quota data');
        setIsRefreshingQuota(true);
        refreshAccount(currentAccountId).finally(() => {
          setIsRefreshingQuota(false);
        });
      }
    }
  }, [currentAccountId, getCurrentAccount, refreshAccount, isRefreshingQuota]);

  // Debug logging for labels
  React.useEffect(() => {
    logger.debug('🏷️ [SIDEBAR] Labels updated:', labels.length, labels);
    logger.debug('🏷️ [SIDEBAR] All label types:', [...new Set(labels.map(l => l.type))]);
    logger.debug('🏷️ [SIDEBAR] User labels:', labels.filter(l => l.type === 'user').length);
    logger.debug('🏷️ [SIDEBAR] System labels:', labels.filter(l => l.type === 'system').length);
    logger.debug('🏷️ [SIDEBAR] All user label IDs:', labels.filter(l => l.type === 'user').map(l => ({ id: l.id, name: l.name, visibility: l.labelListVisibility })));
    logger.debug('🏷️ [SIDEBAR] show labels:', labels.filter(l => l.labelListVisibility === 'show').length);
    logger.debug('🏷️ [SIDEBAR] hide labels:', labels.filter(l => l.labelListVisibility === 'hide').length);
    logger.debug('🏷️ [SIDEBAR] All visibilities:', [...new Set(labels.map(l => l.labelListVisibility))]);
    logger.debug('🏷️ [SIDEBAR] User labels with labelShow:', labels.filter(l => 
      l.type === 'user' && 
      l.labelListVisibility === 'show'
    ).map(l => ({ id: l.id, name: l.name })));
    logger.debug('🏷️ [SIDEBAR] All user labels regardless of visibility:', labels.filter(l => l.type === 'user').map(l => ({ id: l.id, name: l.name, visibility: l.labelListVisibility })));
  }, [labels]);

  // Get real counts from labels (use threadsUnread for conversations count)
  const getLabelCount = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    const count = label?.threadsUnread || 0;
    
    // Debug logging for problematic labels
    if (labelId === 'INBOX' || labelId === 'STARRED') {
      logger.debug(`📊 [SIDEBAR] Label ${labelId}:`, {
        found: !!label,
        threadsUnread: label?.threadsUnread,
        messagesUnread: label?.messagesUnread,
        messagesTotal: label?.messagesTotal,
        returnedCount: count,
        fullLabel: label
      });
    }
    
    return count;
  };

  // Check if SNOOZED label exists before including it
  const hasSnoozedLabel = labels.some(label => label.id === 'SNOOZED');
  
  const mainFolders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: getLabelCount('INBOX') },
    { id: 'starred', name: 'Starred', icon: Star, count: getLabelCount('STARRED') },
    // Only include Snoozed if the label exists
    ...(hasSnoozedLabel ? [{ id: 'snoozed', name: 'Snoozed', icon: Clock, count: getLabelCount('SNOOZED') }] : []),
    { id: 'sent', name: 'Sent', icon: Send, count: getLabelCount('SENT') },
    { id: 'drafts', name: 'Drafts', icon: FileText, count: getLabelCount('DRAFT') },
    { id: 'all', name: 'All mail', icon: Archive },
    { id: 'spam', name: 'Spam', icon: AlertTriangle, count: getLabelCount('SPAM') },
    { id: 'trash', name: 'Trash', icon: Trash2, count: getLabelCount('TRASH') },
  ];

  const handleFolderClick = async (folderId: string) => {
    // Map folder IDs to Gmail labels
    const labelMap: Record<string, string> = {
      'inbox': 'INBOX',
      'starred': 'STARRED',
      'snoozed': 'SNOOZED',
      'sent': 'SENT',
      'drafts': 'DRAFT',
      'all': 'all', // All mail uses 'all' as the view identifier
      'spam': 'SPAM',
      'trash': 'TRASH'
    };
    
    const viewId = labelMap[folderId];
    
    // Set currentView to the actual Gmail label (uppercase) instead of folder id
    setCurrentView(viewId as any);
    
    // Fetch messages for the selected folder
    const { fetchMessages } = useMailStore.getState();
    
    // For 'all' mail, pass undefined to fetch all messages, otherwise use the label
    const fetchLabelId = viewId === 'all' ? undefined : viewId;
    await fetchMessages(fetchLabelId);
  };

  const handleLabelClick = async (labelId: string) => {
    logger.debug(`📊 [SIDEBAR] Label ${labelId} clicked`);
    setCurrentLabel(labelId);
    // Fetch messages for the selected label
    const { fetchMessages } = useMailStore.getState();
    await fetchMessages(labelId);
  };

  // If closed, show slim 40px gutter handle aligned like Canvas/Chat
  if (!isOpen) {
    return (
      <div
        style={{
          width: '40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-24px'
        }}
      >
        <button
          onClick={onToggle}
          title="Show mail folders"
          aria-label="Show mail folders"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: '#7B8794',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F4F6F8';
            e.currentTarget.style.color = '#323F4B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#7B8794';
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <Card 
      className="flex h-full w-[340px] shrink-0 flex-col"
      padding="md"
    >
      {/* Header */}
      <div 
        className="border-border-default mb-4 flex items-center justify-between border-b p-4"
      >
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-secondary" />
          <Text size="lg" weight="semibold">Mail</Text>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide mail folders"
            className="text-secondary hover:text-primary"
          >
            <PanelLeft size={18} />
          </Button>
        )}
      </div>

      {/* Compose Button */}
      <div className="mb-4">
        <Button
          onClick={() => startCompose()}
          variant="primary"
          className="w-full"
          size="default"
        >
          <Edit size={18} />
          Compose
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Main Folders */}
        <div className="flex flex-col gap-1">
          {mainFolders.map((folder) => {
            const Icon = folder.icon;
            
            // Map folder IDs to Gmail labels for active state check
            const labelMap: Record<string, string> = {
              'inbox': 'INBOX',
              'starred': 'STARRED',
              'snoozed': 'SNOOZED',
              'sent': 'SENT',
              'drafts': 'DRAFT',
              'all': 'all', // All mail uses 'all' as the view identifier
              'spam': 'SPAM',
              'trash': 'TRASH'
            };
            
            const expectedView = labelMap[folder.id];
            const isActive = currentView === expectedView;
            
            return (
              <Card
                key={folder.id}
                padding="none"
                className={`group relative cursor-pointer ${
                  isActive 
                    ? 'border-selected bg-selected' 
                    : 'border-transparent hover:bg-hover'
                }`}
                onClick={() => handleFolderClick(folder.id)}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={`shrink-0 ${isActive ? 'text-selected' : 'text-secondary'}`} 
                    />
                    <Text 
                      size="sm" 
                      weight={isActive ? "semibold" : "medium"}
                      variant={isActive ? "body" : "secondary"}
                      className="flex-1 truncate"
                    >
                      {folder.name}
                    </Text>
                    <div className="flex min-w-[24px] items-center justify-center">
                      {folder.count && folder.count > 0 && (
                        <Badge variant="secondary" className="text-[11px]">
                          {folder.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Labels Section */}
        <div className="mt-6">
          <Card
            padding="none"
          >
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div 
                  className="flex flex-1 cursor-pointer items-center gap-2"
                  onClick={() => setLabelsExpanded(!labelsExpanded)}
                >
                  {labelsExpanded ? (
                    <ChevronDown size={16} className="text-secondary" />
                  ) : (
                    <ChevronRight size={16} className="text-secondary" />
                  )}
                  <Caption 
                    className="font-semibold uppercase tracking-wider"
                  >
                    Labels
                  </Caption>
                </div>
                
                {/* Label Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-primary hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLabelManagerMode('manage');
                      setIsLabelManagerOpen(true);
                    }}
                    title="Manage labels"
                  >
                    <Settings size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {labelsExpanded && (
            <div className="mt-2">
              <div className="flex flex-col gap-1">
                {labels.length > 0 ? (
                  labels.filter(label => 
                    label.type === 'user'
                    // Show all user labels regardless of visibility for now
                  ).slice(0, 20).map((label) => {
                    const isActive = currentLabel === label.id;
                    
                    return (
                      <Card
                        key={label.id}
                        padding="none"
                        className={`group relative cursor-pointer ${
                          isActive 
                            ? 'border-selected bg-selected' 
                            : 'border-transparent hover:bg-hover'
                        }`}
                        onClick={() => handleLabelClick(label.id)}
                      >
                        <div className="p-3">
                          <div 
                            className="flex items-center gap-3"
                          >
                            <Tag 
                              size={16} 
                              className={`shrink-0 ${isActive ? 'text-selected' : 'text-secondary'}`} 
                            />
                            <Text 
                              size="sm" 
                              weight={isActive ? "semibold" : "medium"}
                              variant={isActive ? "body" : "secondary"}
                              className="flex-1 truncate"
                            >
                              {label.name}
                            </Text>
                            <div className="flex min-w-[24px] items-center justify-center">
                              {label.threadsUnread && label.threadsUnread > 0 && (
                                <Badge variant="secondary" className="text-[11px]">
                                  {label.threadsUnread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center p-6">
                    <Text size="sm" variant="secondary">
                      {isAuthenticated ? 'Loading labels...' : 'No labels yet'}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storage Info */}
      <div className="border-border-subtle mt-auto border-t p-4">
        {activeAccount ? (
          <StorageInfo 
            account={activeAccount} 
            onRefresh={() => refreshAccount(activeAccount.id)} 
          />
        ) : (
          <div className="py-2 text-center">
            <Text size="xs" variant="tertiary">Sign in to view storage</Text>
          </div>
        )}
      </div>

      {/* Streamlined Label Manager */}
      <StreamlinedLabelManager
        mode={labelManagerMode}
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
        onLabelCreated={(label) => {
          logger.debug('Label created:', label);
          // Refresh labels after creation
          if (currentAccountId) {
            fetchLabels(currentAccountId);
          }
        }}
        onLabelUpdated={(label) => {
          logger.debug('Label updated:', label);
          // Refresh labels after update
          if (currentAccountId) {
            fetchLabels(currentAccountId);
          }
        }}
        onLabelDeleted={(labelId) => {
          logger.debug('Label deleted:', labelId);
          // Refresh labels after deletion
          if (currentAccountId) {
            fetchLabels(currentAccountId);
          }
        }}
      />


    </Card>
  );
}
