import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';
import { Edit, PanelRight, PanelLeft } from 'lucide-react';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import { MailToolbar } from '../../features/mail/components/MailToolbar';
import { MessageList } from '../../features/mail/components/MessageList';
import { ThreadedMessageList } from '../../features/mail/components/ThreadedMessageList';
import { MessageView } from '../../features/mail/components/MessageView';
import { ComposeModal } from '../../features/mail/components/ComposeModal';
import { MailSearchBar } from '../../features/mail/components/MailSearchBar';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { useComposeOperation } from '../../features/mail/hooks';
import { GmailTauriTestComponent } from '../../features/mail/components/GmailTauriTestComponent';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { Button } from '../../components/ui';

export default function Mail() {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const { currentMessage, isComposing, currentView, currentAccountId, signOut, isHydrated } = useMailStore();
  const { handleStartCompose } = useComposeOperation();
  const [isMailSidebarOpen, setIsMailSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [showTestComponent, setShowTestComponent] = useState(false);
  const [isThreadedView, setIsThreadedView] = useState(true); // Default to threaded view for MVP
  
  // Use centralized Google authentication
  const activeGoogleAccount = useActiveGoogleAccount();

  const toggleMailSidebar = useCallback(() => {
    setIsMailSidebarOpen(!isMailSidebarOpen);
  }, [isMailSidebarOpen]);

  const toggleContext = useCallback(() => {
    setIsContextOpen(!isContextOpen);
  }, [isContextOpen]);

  const toggleTestComponent = useCallback(() => {
    setShowTestComponent(!showTestComponent);
  }, [showTestComponent]);

  // No local authentication handling needed - using centralized auth from Settings

  // Setup header when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "Mail"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  // Show loading while waiting for hydration
  if (!isHydrated) {
    return (
      <div className="flex h-full bg-[var(--bg-primary)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Check centralized Google authentication
  if (!activeGoogleAccount || !activeGoogleAccount.services?.gmail) {
    return (
      <div className="flex h-full bg-[var(--bg-primary)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Google Account Connected
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Please connect a Google account in Settings to access your Gmail
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/settings')}
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-6 lg:p-8 gap-6 lg:gap-8">
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
            {currentAccountId && (
              <GmailTauriTestComponent 
                accountId={currentAccountId} 
                onResult={(result) => {
                  console.log('Test result:', result);
                }}
              />
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex-shrink-0 p-[var(--space-4)] bg-[var(--bg-tertiary)] rounded-t-[var(--radius-xl)]">
          <MailSearchBar />
        </div>

        {/* Mail Toolbar */}
        <div className="flex-shrink-0 bg-[var(--bg-tertiary)] border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <MailToolbar />
            {/* Threading Toggle */}
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-[var(--text-secondary)]">View:</span>
              <div className="flex bg-[var(--bg-primary)] rounded-lg p-1">
                <button
                  onClick={() => setIsThreadedView(true)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    isThreadedView 
                      ? 'bg-[var(--accent-primary)] text-white' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Conversations
                </button>
                <button
                  onClick={() => setIsThreadedView(false)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    !isThreadedView 
                      ? 'bg-[var(--accent-primary)] text-white' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Messages
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Card-like design with softer borders */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[var(--bg-tertiary)]">
          {/* Message List - Softer styling */}
          <div className={`${
            currentMessage 
              ? `${isContextOpen ? 'w-72' : 'w-80'} flex-shrink-0` 
              : 'flex-1'
          } flex flex-col ${currentMessage ? 'border-r border-[var(--border-default)]' : ''} min-w-0 overflow-hidden bg-[var(--bg-tertiary)]`}>
            {isThreadedView ? <ThreadedMessageList /> : <MessageList />}
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