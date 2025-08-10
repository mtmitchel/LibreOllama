import React, { useState, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import { MailToolbar } from '../../features/mail/components/MailToolbar';
import { EnhancedSearchBar, EnhancedMessageList } from '../../features/mail/components';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { ComposeModal } from '../../features/mail/components';
import { MessageViewModal } from '../../features/mail/components/MessageViewModal';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { Page, PageCard } from '../../components/ui/design-system/Page';
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
        background: 'var(--bg-page)',
        // Mirror canvas/chat: remove side padding when the corresponding panel is closed
        padding: `${24}px ${isContextOpen ? 24 : 0}px ${24}px ${isMailSidebarOpen ? 24 : 0}px`,
        gap: isMailSidebarOpen ? '24px' : '0px'
      }}
    >
      {/* Mail Sidebar */}
      <MailSidebar 
        isOpen={isMailSidebarOpen}
        onToggle={toggleMailSidebar}
      />

      {/* Main + Context grouped to keep inner 24px gap */}
      <div style={{ display: 'flex', gap: isContextOpen ? '24px' : '0px', flex: 1, alignItems: 'stretch', minWidth: 0 }}>
        {/* Main Content Area */}
        <div className="asana-mail-content" style={{ minWidth: 0 }}>
          
          {/* Enhanced Search Bar */}
          <div className="asana-mail-content-header">
            <EnhancedSearchBar 
              onAdvancedSearch={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            />
          </div>

          {/* Mail Toolbar */}
          <MailToolbar />


          {/* Message List */}
          <div className="asana-mail-content-body">
            <EnhancedMessageList />
          </div>
          
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

      {/* Compose Modal - Only show for new compose, not replies */}
      {isComposing && !currentMessage && <ComposeModal />}
      
      {/* Message View Modal */}
      {currentMessage && <MessageViewModal />}
    </div>
      </PageCard>
    </Page>
  );
} 