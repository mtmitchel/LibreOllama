import React, { useState, useCallback, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Edit, PanelRight, PanelLeft } from 'lucide-react';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import { MailToolbar } from '../../features/mail/components/MailToolbar';
import { MessageList } from '../../features/mail/components/MessageList';
import { MessageView } from '../../features/mail/components/MessageView';
import { ComposeModal } from '../../features/mail/components/ComposeModal';
import { MailSearchBar } from '../../features/mail/components/MailSearchBar';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { useMailStore } from '../../features/mail/stores/mailStore';

export default function Mail() {
  const { setHeaderProps } = useHeader();
  const { currentMessage, isComposing, startCompose, currentView } = useMailStore();
  const [isMailSidebarOpen, setIsMailSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(true);

  const toggleMailSidebar = useCallback(() => {
    setIsMailSidebarOpen(!isMailSidebarOpen);
  }, [isMailSidebarOpen]);

  const toggleContext = useCallback(() => {
    setIsContextOpen(!isContextOpen);
  }, [isContextOpen]);

  // Setup header when component mounts
  useEffect(() => {
    const viewNames = {
      'inbox': 'Inbox',
      'starred': 'Starred',
      'sent': 'Sent',
      'drafts': 'Drafts',
      'archive': 'Archive',
      'trash': 'Trash'
    };
    
    const currentViewName = viewNames[currentView as keyof typeof viewNames] || 'Mail';
    
    setHeaderProps({
      title: currentMessage ? `${currentMessage.subject}` : currentViewName,
      breadcrumb: currentMessage 
        ? [{label: "Mail", onClick: () => {}}, {label: currentViewName}, {label: currentMessage.subject}] 
        : [{label: "Mail"}],
      primaryAction: {
        label: 'Compose',
        onClick: startCompose,
        icon: <Edit size={16} />
      },
      secondaryActions: [
        {
          label: isMailSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar',
          onClick: toggleMailSidebar,
          icon: <PanelLeft size={16} />
        },
        {
          label: isContextOpen ? 'Hide Context' : 'Show Context',
          onClick: toggleContext,
          icon: <PanelRight size={16} />
        }
      ]
    });
  }, [setHeaderProps, currentMessage, currentView, startCompose, toggleMailSidebar, toggleContext, isMailSidebarOpen, isContextOpen]);

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
      {/* Mail Sidebar */}
      <MailSidebar 
        isOpen={isMailSidebarOpen}
        onToggle={toggleMailSidebar}
      />

      {/* Main Mail Container */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] min-w-0">
        {/* Search Bar */}
        <div className="flex-shrink-0 p-[var(--space-4)] border-b border-[var(--border-default)]">
          <MailSearchBar />
        </div>

        {/* Mail Toolbar */}
        <div className="flex-shrink-0 border-b border-[var(--border-default)]">
          <MailToolbar />
        </div>

        {/* Content Area - Flexible Growth */}
        <div className="flex-1 flex min-h-0">
          {/* Message List */}
          <div className={`${currentMessage ? 'w-1/2' : 'flex-1'} flex flex-col border-r border-[var(--border-default)]`}>
            <MessageList />
          </div>

          {/* Message View */}
          {currentMessage && (
            <div className="w-1/2 flex flex-col">
              <MessageView />
            </div>
          )}
        </div>
      </div>

      {/* Context Sidebar */}
      <MailContextSidebar 
        isOpen={isContextOpen}
        messageId={currentMessage?.id}
        onToggle={toggleContext}
      />

      {/* Compose Modal */}
      {isComposing && <ComposeModal />}
    </div>
  );
} 