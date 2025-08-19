import React, { useState, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import MailToolbar from '../../features/mail/components/MailToolbar';
import { EnhancedSearchBar, EnhancedMessageList } from '../../features/mail/components';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { ComposeModal } from '../../features/mail/components';
import { MessageViewModal } from '../../features/mail/components/MessageViewModal';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { Page, PageCard } from '../../components/ui/design-system/Page';
import { Card } from '../../components/ui/design-system/Card';
// Import debug utilities (only in dev mode)
if (import.meta.env.DEV) {
  import('../../features/mail/utils/debugGmail');
}

export default function Mail() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const { isComposing, currentMessage, isHydrated, isAuthenticated, accounts, loadStoredAccounts } = useMailStore();
  const [isMailSidebarOpen, setIsMailSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isThreadedView, setIsThreadedView] = useState(true);
  const [listViewType, setListViewType] = useState<'enhanced'>('enhanced');
  const [selectedMessages] = useState<string[]>([]);

  // Mail has its own header, so we don't need the unified header
  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // Auth initialization is now handled by MailStoreProvider

  const toggleMailSidebar = () => setIsMailSidebarOpen(!isMailSidebarOpen);
  const toggleContext = () => setIsContextOpen(!isContextOpen);

  // Placeholder functions for missing handlers
  const handleOpenLabelPicker = () => {};

  return (
    <Page full>
      <PageCard>
    <div
      className="asana-mail"
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--asana-bg-secondary)',
        padding: `${24}px ${isContextOpen ? 24 : 0}px ${24}px ${isMailSidebarOpen ? 24 : 0}px`,
        gap: isMailSidebarOpen ? '24px' : '0px'
      }}
    >
      {/* Mail Sidebar */}
      <MailSidebar 
        isOpen={isMailSidebarOpen}
        onToggle={toggleMailSidebar}
      />

      {/* Main + Right Context grouped so their internal gap remains 24px */}
      <div style={{ display: 'flex', gap: isContextOpen ? '24px' : '0px', flex: 1, minWidth: 0 }}>
        {/* Main Mail Area */}
        <div className="asana-mail-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          
          <Card className="flex h-full w-full" padding="none" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Enhanced Search Bar */}
            <div style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
              <EnhancedSearchBar 
                onAdvancedSearch={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              />
            </div>

            {/* Mail Toolbar */}
            <MailToolbar />

            {/* Message List */}
            <div className="asana-mail-content-body" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <EnhancedMessageList showActionBar={false} />
            </div>
          </Card>
        </div>

        {/* Context Sidebar */}
        <MailContextSidebar 
          isOpen={isContextOpen}
          onToggle={toggleContext}
          isThreadedView={isThreadedView}
          onThreadedViewChange={setIsThreadedView}
          listViewType={listViewType}
          onListViewTypeChange={setListViewType}
        />
      </div>
    </div>

    {/* Compose Modal - Only show for new compose, not replies */}
    {isComposing && !currentMessage && <ComposeModal />}
    
    {/* Message View Modal */}
    {currentMessage && <MessageViewModal />}
      </PageCard>
    </Page>
  );
} 