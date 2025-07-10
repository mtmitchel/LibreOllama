import React from 'react';
import { Button, Text, Card, Caption, Badge } from '../../../components/ui';
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
  RefreshCw,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { GmailAccount } from '../types';
import { useState } from 'react';

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
  
  if (typeof quotaUsed !== 'number' || typeof quotaTotal !== 'number' || quotaTotal <= 0) {
    return (
      <div className="text-center py-2">
        <Text size="xs" variant="tertiary">
          {isRefreshing ? 'Loading storage info...' : 'Storage info unavailable'}
        </Text>
      </div>
    );
  }

  const usedGiB = (quotaUsed / (1024 * 1024 * 1024)).toFixed(1);
  const totalGiB = (quotaTotal / (1024 * 1024 * 1024)).toFixed(1);
  const percentage = (quotaUsed / quotaTotal) * 100;

  return (
    <>
      <div className="flex justify-between items-center mb-1">
        <Text size="xs" weight="semibold" variant="secondary">Storage</Text>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh storage quota"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Manage storage">
            <ExternalLink size={12} />
          </Button>
        </div>
      </div>
      <Text size="xs" variant="tertiary" className="mb-2">
        {usedGiB} GiB of {totalGiB} GiB used
      </Text>
      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1">
        <div 
          className="bg-[var(--accent-primary)] h-1 rounded-full" 
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

  // Fetch labels and refresh quota when component mounts or account changes
  React.useEffect(() => {
    if (isAuthenticated && currentAccountId) {
      console.log('🏷️ [SIDEBAR] Fetching labels for account:', currentAccountId);
      fetchLabels(currentAccountId).catch(error => {
        console.error('🏷️ [SIDEBAR] Failed to fetch labels:', error);
      });
      
      // Also refresh account quota to get latest values
      console.log('💾 [SIDEBAR] Refreshing quota for account:', currentAccountId);
      refreshAccount(currentAccountId).catch(error => {
        console.error('💾 [SIDEBAR] Failed to refresh quota:', error);
      });
    }
  }, [isAuthenticated, currentAccountId, fetchLabels, refreshAccount]);

  // Auto-refresh quota if it's missing
  React.useEffect(() => {
    const currentAccount = getCurrentAccount();
    if (currentAccount && currentAccountId && !isRefreshingQuota) {
      const hasQuotaData = typeof currentAccount.quotaUsed !== 'undefined' || typeof currentAccount.quotaTotal !== 'undefined';
      
      if (!hasQuotaData) {
        console.log('🔄 [SIDEBAR] Auto-refreshing missing quota data');
        setIsRefreshingQuota(true);
        refreshAccount(currentAccountId).finally(() => {
          setIsRefreshingQuota(false);
        });
      }
    }
  }, [currentAccountId, getCurrentAccount, refreshAccount, isRefreshingQuota]);

  // Debug logging for labels
  React.useEffect(() => {
    console.log('🏷️ [SIDEBAR] Labels updated:', labels.length, labels);
    console.log('🏷️ [SIDEBAR] All label types:', [...new Set(labels.map(l => l.type))]);
    console.log('🏷️ [SIDEBAR] User labels:', labels.filter(l => l.type === 'user').length);
    console.log('🏷️ [SIDEBAR] System labels:', labels.filter(l => l.type === 'system').length);
    console.log('🏷️ [SIDEBAR] All user label IDs:', labels.filter(l => l.type === 'user').map(l => ({ id: l.id, name: l.name, visibility: l.labelListVisibility })));
    console.log('🏷️ [SIDEBAR] labelShow labels:', labels.filter(l => l.labelListVisibility === 'labelShow').length);
    console.log('🏷️ [SIDEBAR] labelHide labels:', labels.filter(l => l.labelListVisibility === 'labelHide').length);
    console.log('🏷️ [SIDEBAR] All visibilities:', [...new Set(labels.map(l => l.labelListVisibility))]);
    console.log('🏷️ [SIDEBAR] User labels with labelShow:', labels.filter(l => 
      l.type === 'user' && 
      l.labelListVisibility === 'labelShow'
    ).map(l => ({ id: l.id, name: l.name })));
    console.log('🏷️ [SIDEBAR] All user labels regardless of visibility:', labels.filter(l => l.type === 'user').map(l => ({ id: l.id, name: l.name, visibility: l.labelListVisibility })));
  }, [labels]);

  // Get real counts from labels (use threadsUnread for conversations count)
  const getLabelCount = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label?.threadsUnread || 0;
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
    { id: 'all', name: 'All Mail', icon: Archive },
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
    setCurrentLabel(labelId);
    // Fetch messages for the selected label
    const { fetchMessages } = useMailStore.getState();
    await fetchMessages(labelId);
  };

  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="w-16 h-full flex flex-col bg-[var(--bg-secondary)]/30" padding="none">
        <div 
          className="border-b border-[var(--border-default)] flex flex-col items-center"
          style={{ padding: 'var(--space-3)' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show mail folders"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            <Mail size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startCompose()}
            title="Compose new email"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-ghost)]"
          >
            <Edit size={18} />
          </Button>
        </div>
        
        <div 
          className="flex-1 flex flex-col items-center"
          style={{ 
            paddingTop: 'var(--space-4)',
            gap: 'var(--space-2)'
          }}
        >
          {/* Show indicators for main folders */}
          {mainFolders.slice(0, 4).map(folder => {
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
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                title={folder.name}
                className={`w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-all hover:scale-105 ${
                  isActive 
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)]'
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
          
          {/* Folder count indicator */}
          <div 
            className="flex flex-col items-center mt-2"
            style={{ 
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}
          >
            <div className="w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
              <Text size="xs" weight="bold" className="text-white">
                {mainFolders.length}
              </Text>
            </div>
            <Text size="xs" variant="tertiary" className="text-center">
              Folders
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="w-[340px] flex-shrink-0 flex flex-col h-full"
      padding="default"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between border-b border-[var(--border-default)]"
        style={{ 
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
          <Text size="lg" weight="semibold">Mail</Text>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide mail folders"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <PanelLeft size={18} />
          </Button>
        )}
      </div>

      {/* Compose Button */}
      <div className="mb-[var(--space-4)]">
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
      <div className="flex-1 overflow-y-auto pr-[var(--space-1)]">
        {/* Main Folders */}
        <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
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
                className={`cursor-pointer group relative ${
                  isActive 
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]' 
                    : 'hover:bg-[var(--bg-surface)] border-transparent'
                }`}
                onClick={() => handleFolderClick(folder.id)}
              >
                <div style={{ padding: 'var(--space-3)' }}>
                  <div 
                    className="flex items-center"
                    style={{ gap: 'var(--space-3)' }}
                  >
                    <Icon 
                      size={18} 
                      className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} 
                    />
                    <Text 
                      size="sm" 
                      weight={isActive ? "semibold" : "medium"}
                      variant={isActive ? "body" : "secondary"}
                      className="flex-1 truncate"
                    >
                      {folder.name}
                    </Text>
                    {folder.count && folder.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {folder.count}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Labels Section */}
        <div style={{ marginTop: 'var(--space-6)' }}>
          <Card
            padding="none"
            className="cursor-pointer"
            onClick={() => setLabelsExpanded(!labelsExpanded)}
          >
            <div style={{ padding: 'var(--space-3)' }}>
              <div 
                className="flex items-center"
                style={{ gap: 'var(--space-2)' }}
              >
                {labelsExpanded ? (
                  <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                )}
                <Caption 
                  className="uppercase tracking-wider font-semibold"
                >
                  Labels
                </Caption>
              </div>
            </div>
          </Card>

          {labelsExpanded && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
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
                        className={`cursor-pointer group relative ${
                          isActive 
                            ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]' 
                            : 'hover:bg-[var(--bg-surface)] border-transparent'
                        }`}
                        onClick={() => handleLabelClick(label.id)}
                      >
                        <div style={{ padding: 'var(--space-3)' }}>
                          <div 
                            className="flex items-center"
                            style={{ gap: 'var(--space-3)' }}
                          >
                            <Tag 
                              size={16} 
                              className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} 
                            />
                            <Text 
                              size="sm" 
                              weight={isActive ? "semibold" : "medium"}
                              variant={isActive ? "body" : "secondary"}
                              className="flex-1 truncate"
                            >
                              {label.name}
                            </Text>
                            {label.threadsUnread && label.threadsUnread > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {label.threadsUnread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div style={{ padding: 'var(--space-3)' }}>
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
      <div className="mt-auto p-4 border-t border-[var(--border-default)]">
        {activeAccount ? (
          <StorageInfo 
            account={activeAccount} 
            onRefresh={() => refreshAccount(activeAccount.id)} 
          />
        ) : (
          <div className="text-center py-2">
            <Text size="xs" variant="tertiary">Sign in to view storage</Text>
          </div>
        )}
      </div>
    </Card>
  );
}