import React, { useState, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import { MailToolbar } from '../../features/mail/components/MailToolbar';
import { EnhancedSearchBar, EnhancedMessageList } from '../../features/mail/components';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { ComposeModal } from '../../features/mail/components';
import { MessageViewModal } from '../../features/mail/components/MessageViewModal';
import { useMailStore } from '../../features/mail/stores/mailStore';
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

  useEffect(() => {
    setHeaderProps({
      title: "Mail"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  // Auth initialization is now handled by MailStoreProvider

  const toggleMailSidebar = () => setIsMailSidebarOpen(!isMailSidebarOpen);
  const toggleContext = () => setIsContextOpen(!isContextOpen);

  // Placeholder functions for missing handlers
  const handleOpenLabelPicker = () => {};

  return (
    <div className="flex h-full gap-6 bg-primary p-6">
      {/* Mail Sidebar */}
      <MailSidebar 
        isOpen={isMailSidebarOpen}
        onToggle={toggleMailSidebar}
      />

      {/* Main Content Area */}
      <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          
          {/* Enhanced Search Bar */}
          <div className="bg-bg-tertiary shrink-0 rounded-t-xl p-4">
            <EnhancedSearchBar 
              onAdvancedSearch={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            />
          </div>

          {/* Mail Toolbar */}
          <MailToolbar />


          {/* Message List */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
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

      {/* Compose Modal - Only show for new compose, not replies */}
      {isComposing && !currentMessage && <ComposeModal />}
      
      {/* Message View Modal */}
      {currentMessage && <MessageViewModal />}
    </div>
  );
} 