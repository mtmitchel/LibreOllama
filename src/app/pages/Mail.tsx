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
import { GmailAuthModal } from '../../features/mail/components/GmailAuthModal';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { useComposeOperation } from '../../features/mail/hooks';
import { GmailTauriTestComponent } from '../../features/mail/components/GmailTauriTestComponent';

export default function Mail() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const { currentMessage, isComposing, currentView, isAuthenticated, currentAccountId, signOut } = useMailStore();
  const { handleStartCompose } = useComposeOperation();
  const [isMailSidebarOpen, setIsMailSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated);
  const [showTestComponent, setShowTestComponent] = useState(false);

  const toggleMailSidebar = useCallback(() => {
    setIsMailSidebarOpen(!isMailSidebarOpen);
  }, [isMailSidebarOpen]);

  const toggleContext = useCallback(() => {
    setIsContextOpen(!isContextOpen);
  }, [isContextOpen]);

  const toggleTestComponent = useCallback(() => {
    setShowTestComponent(!showTestComponent);
  }, [showTestComponent]);

  // Handle authentication state changes
  useEffect(() => {
    setShowAuthModal(!isAuthenticated);
    
    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true' && isAuthenticated) {
      // Clear the URL parameter
      window.history.replaceState({}, '', '/mail');
    }
  }, [isAuthenticated]);

  // Setup header when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "Mail"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="flex h-full bg-[var(--bg-primary)] items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Welcome to Mail
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Sign in to your Gmail account to get started
            </p>
          </div>
        </div>
        <GmailAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
      {/* Mail Sidebar */}
      <MailSidebar 
        isOpen={isMailSidebarOpen}
        onToggle={toggleMailSidebar}
      />

      {/* Main Mail Container - Softer design with rounded corners */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] min-w-0 overflow-hidden shadow-sm border border-[var(--border-default)]">
        {/* Test Component - Temporarily added for validation */}
        {showTestComponent && (
          <div className="flex-shrink-0 p-[var(--space-4)] bg-[var(--bg-tertiary)] border-b border-[var(--border-default)]">
            <GmailTauriTestComponent 
              accountId={currentAccountId || 'test-account-1'} 
              onResult={(result) => {
                console.log('Test result:', result);
              }}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="flex-shrink-0 p-[var(--space-4)] bg-[var(--bg-tertiary)] rounded-t-[var(--radius-xl)]">
          <MailSearchBar />
        </div>

        {/* Mail Toolbar */}
        <div className="flex-shrink-0 bg-[var(--bg-tertiary)] border-b border-[var(--border-default)]">
          <MailToolbar />
        </div>

        {/* Content Area - Card-like design with softer borders */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[var(--bg-tertiary)]">
          {/* Message List - Softer styling */}
          <div className={`${
            currentMessage 
              ? `${isContextOpen ? 'w-72' : 'w-80'} flex-shrink-0` 
              : 'flex-1'
          } flex flex-col ${currentMessage ? 'border-r border-[var(--border-default)]' : ''} min-w-0 overflow-hidden bg-[var(--bg-tertiary)]`}>
            <MessageList />
          </div>

          {/* Message View - Card-like styling */}
          {currentMessage && (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-tertiary)]">
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