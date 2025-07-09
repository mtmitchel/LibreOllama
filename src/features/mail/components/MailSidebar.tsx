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
  LogOut
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';

interface MailSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
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

  const mainFolders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: 25 },
    { id: 'starred', name: 'Starred', icon: Star },
    { id: 'snoozed', name: 'Snoozed', icon: Clock },
    { id: 'sent', name: 'Sent', icon: Send },
    { id: 'drafts', name: 'Drafts', icon: FileText },
    { id: 'all', name: 'All Mail', icon: Archive },
    { id: 'spam', name: 'Spam', icon: AlertTriangle },
    { id: 'trash', name: 'Trash', icon: Trash2 },
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
                    {folder.count && (
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
                            {label.messagesUnread && label.messagesUnread > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {label.messagesUnread}
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
      <div style={{ 
        marginTop: 'var(--space-4)',
        padding: 'var(--space-4)',
        borderTop: '1px solid var(--border-default)'
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
          <Text size="xs" weight="semibold" variant="secondary">Storage</Text>
          <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                if (currentAccountId && !isRefreshingQuota) {
                  setIsRefreshingQuota(true);
                  try {
                    await refreshAccount(currentAccountId);
                  } finally {
                    setIsRefreshingQuota(false);
                  }
                }
              }}
              title="Refresh storage quota"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-6 h-6"
              disabled={isRefreshingQuota}
            >
              <RefreshCw size={14} className={isRefreshingQuota ? 'animate-spin' : ''} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out? You will need to sign in again to access your emails.')) {
                  signOut();
                }
              }}
              title="Sign out"
              className="text-[var(--text-secondary)] hover:text-[var(--text-danger)] w-6 h-6"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
        {(() => {
          const currentAccount = getCurrentAccount();
          console.log('💾 [SIDEBAR] Current account for storage:', currentAccount);
          console.log('💾 [SIDEBAR] Account keys:', currentAccount ? Object.keys(currentAccount) : 'no account');
          
          // Try to get quota from account with multiple possible field names
          let quotaUsed = 0;
          let quotaTotal = 15000000000; // 15GB default
          
          if (currentAccount) {
            // Use the correct GmailAccount properties
            quotaUsed = currentAccount.quotaUsed || 0;
            quotaTotal = currentAccount.quotaTotal || 0; // Don't assume a default
            
            // Don't modify the quota values - they should come from the API
            // If they're wrong, the issue is in the data fetching, not here
          }
          
          console.log('💾 [SIDEBAR] quotaUsed:', quotaUsed, 'bytes');
          console.log('💾 [SIDEBAR] quotaTotal:', quotaTotal, 'bytes');
          console.log('💾 [SIDEBAR] usedGB:', (quotaUsed / 1000000000).toFixed(3));
          console.log('💾 [SIDEBAR] totalGB:', (quotaTotal / 1000000000).toFixed(3));
          console.log('💾 [SIDEBAR] usedGiB:', (quotaUsed / (1024*1024*1024)).toFixed(3));
          console.log('💾 [SIDEBAR] totalGiB:', (quotaTotal / (1024*1024*1024)).toFixed(3));
          console.log('💾 [SIDEBAR] is 100 GiB?:', quotaTotal === 107374182400);
          if (currentAccount) {
            console.log('💾 [SIDEBAR] currentAccount.quotaUsed:', currentAccount.quotaUsed);
            console.log('💾 [SIDEBAR] currentAccount.quotaTotal:', currentAccount.quotaTotal);
            console.log('💾 [SIDEBAR] currentAccount keys:', Object.keys(currentAccount));
            console.log('💾 [SIDEBAR] Full currentAccount:', currentAccount);
          }
          
          // Check for authentication errors
          if (currentAccount && currentAccount.syncStatus === 'error' && currentAccount.errorMessage) {
            return (
              <>
                <Text size="xs" variant="muted" className="text-red-500" style={{ marginBottom: 'var(--space-2)' }}>
                  Authentication Error
                </Text>
                <Text size="xs" variant="tertiary" style={{ marginBottom: 'var(--space-2)' }}>
                  {currentAccount.errorMessage}
                </Text>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => signOut()}
                  className="w-full"
                >
                  <LogOut size={14} />
                  Sign Out
                </Button>
              </>
            );
          }
          
          // If no quota data available at all
          if ((!quotaUsed || quotaUsed === 0) && (!quotaTotal || quotaTotal === 0)) {
            return (
              <>
                <Text size="xs" variant="secondary" style={{ marginBottom: 'var(--space-2)' }}>
                  Storage info unavailable
                </Text>
                <Text size="xs" variant="tertiary">
                  Sign out and sign in again to enable quota
                </Text>
              </>
            );
          }
          
          // Convert bytes to GB or GiB
          const BYTES_PER_GB = 1000000000;
          const BYTES_PER_GIB = 1024 * 1024 * 1024;
          
          // Common Google storage tiers in GiB
          const COMMON_GIB_QUOTAS = [
            15 * BYTES_PER_GIB,    // 15 GiB (free tier)
            100 * BYTES_PER_GIB,   // 100 GiB
            200 * BYTES_PER_GIB,   // 200 GiB
            2048 * BYTES_PER_GIB,  // 2 TiB
          ];
          
          // Check if the quota matches common GiB tiers
          const isLikelyGiB = COMMON_GIB_QUOTAS.includes(quotaTotal);
          
          let usedDisplay: string;
          let totalDisplay: string;
          let unit: string;
          
          if (isLikelyGiB) {
            // Display in GiB for cleaner numbers (100 GiB instead of 107 GB)
            usedDisplay = (quotaUsed / BYTES_PER_GIB).toFixed(1);
            totalDisplay = Math.round(quotaTotal / BYTES_PER_GIB).toString();
            unit = "GB"; // Use GB for consistency even though it's actually GiB
          } else {
            // Display in GB
            usedDisplay = (quotaUsed / BYTES_PER_GB).toFixed(1);
            totalDisplay = Math.round(quotaTotal / BYTES_PER_GB).toString();
            unit = "GB";
          }
          
          console.log('💾 [SIDEBAR] Display values:', {
            isLikelyGiB,
            usedDisplay,
            totalDisplay,
            unit,
            quotaTotalBytes: quotaTotal,
            matchesCommonGiB: COMMON_GIB_QUOTAS.map(q => ({
              sizeGiB: q / BYTES_PER_GIB,
              bytes: q,
              matches: q === quotaTotal
            }))
          });
          
          // Handle cases where Google doesn't return a quota limit
          if (quotaTotal === 0 && quotaUsed > 0) {
            return (
              <>
                <Text size="xs" variant="secondary" style={{ marginBottom: 'var(--space-2)' }}>
                  {usedDisplay} {unit} used
                </Text>
                <Text size="xs" variant="tertiary">
                  Storage limit info not available
                </Text>
              </>
            );
          }
          
          const usagePercentage = quotaTotal > 0 ? (quotaUsed / quotaTotal) * 100 : 0;
          const isOverQuota = quotaUsed > quotaTotal && quotaTotal > 0;
          
          return (
            <>
              <Text size="xs" variant="secondary" className={isOverQuota ? "text-red-500" : ""} style={{ marginBottom: 'var(--space-2)' }}>
                {usedDisplay} {unit} of {totalDisplay} {unit} used
                {isOverQuota && " (Over quota)"}
              </Text>
              <div 
                className="w-full bg-[var(--bg-tertiary)] rounded-full"
                style={{ height: 'var(--space-1)' }}
              >
                <div 
                  className={`h-full rounded-full ${isOverQuota ? 'bg-red-500' : 'bg-[var(--accent-primary)]'}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </>
          );
        })()}
      </div>
    </Card>
  );
} 