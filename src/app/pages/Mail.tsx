import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';
import { Edit, PanelRight, PanelLeft, Filter, Settings, Tag } from 'lucide-react';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import { MailToolbar } from '../../features/mail/components/MailToolbar';
import { MessageList } from '../../features/mail/components/MessageList';
import { VirtualizedMessageList } from '../../features/mail/components/VirtualizedMessageList';
import { InfiniteScrollMessageList } from '../../features/mail/components/InfiniteScrollMessageList';
import { ThreadedMessageList } from '../../features/mail/components/ThreadedMessageList';
import { MessageView } from '../../features/mail/components/MessageView';
import { ComposeModal } from '../../features/mail/components/ComposeModal';
import { EnhancedSearchBar, AdvancedSearchModal, EnhancedMessageList } from '../../features/mail/components';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { LabelManager, LabelPicker, LabelFilter, LabelSettings } from '../../features/mail/components';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { useComposeOperation } from '../../features/mail/hooks';
import { GmailTauriTestComponent } from '../../features/mail/components/GmailTauriTestComponent';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { Button } from '../../components/ui';

export default function Mail() {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const { 
    currentMessage, 
    isComposing, 
    currentView, 
    currentAccountId, 
    signOut, 
    isHydrated,
    selectedMessages,
    selectedLabels,
    setSelectedLabels,
    labelSettings,
    updateLabelSettings 
  } = useMailStore();
  const { handleStartCompose } = useComposeOperation();
  const [isMailSidebarOpen, setIsMailSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [showTestComponent, setShowTestComponent] = useState(false);
  const [isThreadedView, setIsThreadedView] = useState(true); // Default to threaded view for MVP
  const [listViewType, setListViewType] = useState<'classic' | 'virtualized' | 'infinite' | 'enhanced'>('enhanced'); // Default to enhanced for Phase 2.2
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  
  // Phase 2.3 - Label Management State
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [isLabelSettingsOpen, setIsLabelSettingsOpen] = useState(false);
  const [labelPickerState, setLabelPickerState] = useState<{
    isOpen: boolean;
    messageIds: string[];
    currentLabels: string[];
    triggerRef: React.RefObject<HTMLButtonElement> | null;
  }>({
    isOpen: false,
    messageIds: [],
    currentLabels: [],
    triggerRef: null
  });
  const [isLabelFilterOpen, setIsLabelFilterOpen] = useState(false);
  const [isLabelFilterCollapsed, setIsLabelFilterCollapsed] = useState(false);
  
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

  // Phase 2.3 - Label Management Functions
  const handleOpenLabelPicker = useCallback((messageIds: string[], currentLabels: string[], triggerRef: React.RefObject<HTMLButtonElement>) => {
    setLabelPickerState({
      isOpen: true,
      messageIds,
      currentLabels,
      triggerRef
    });
  }, []);

  const handleCloseLabelPicker = useCallback(() => {
    setLabelPickerState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleLabelsChanged = useCallback((messageIds: string[], addedLabels: string[], removedLabels: string[]) => {
    // TODO: Implement actual label changes via store actions
    console.log('Labels changed:', { messageIds, addedLabels, removedLabels });
  }, []);

  const handleLabelCreated = useCallback((label: any) => {
    console.log('Label created:', label);
    // TODO: Update store with new label
  }, []);

  const handleLabelUpdated = useCallback((label: any) => {
    console.log('Label updated:', label);
    // TODO: Update store with updated label
  }, []);

  const handleLabelDeleted = useCallback((labelId: string) => {
    console.log('Label deleted:', labelId);
    // TODO: Remove label from store
  }, []);

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

        {/* Enhanced Search Bar */}
        <div className="flex-shrink-0 p-[var(--space-4)] bg-[var(--bg-tertiary)] rounded-t-[var(--radius-xl)]">
          <EnhancedSearchBar 
            onSearch={(query) => {
              console.log('Search initiated:', query);
            }}
            onAdvancedSearch={() => setIsAdvancedSearchOpen(true)}
            placeholder="Search mail with operators (from:, to:, subject:, etc.)"
          />
        </div>

        {/* Mail Toolbar */}
        <div className="flex-shrink-0 bg-[var(--bg-tertiary)] border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <MailToolbar />
            
            {/* Label Management Controls */}
            <div className="flex items-center gap-2 px-4">
              {/* Label Picker for Selected Messages */}
              {selectedMessages.length > 0 && (
                <button
                  onClick={() => {
                    // TODO: Get current labels for selected messages
                    handleOpenLabelPicker(selectedMessages, [], null);
                  }}
                  className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                  title="Apply labels to selected messages"
                >
                  <Tag className="h-4 w-4" />
                </button>
              )}

              {/* Label Manager */}
              <button
                onClick={() => setIsLabelManagerOpen(true)}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                title="Manage labels"
              >
                <Edit className="h-4 w-4" />
              </button>

              {/* Label Settings */}
              <button
                onClick={() => setIsLabelSettingsOpen(true)}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                title="Label settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-4 px-4">
              {/* Threading Toggle */}
              <div className="flex items-center gap-2">
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

              {/* List View Type - Only shown for Messages view */}
              {!isThreadedView && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)]">View Mode:</span>
                  <div className="flex bg-[var(--bg-primary)] rounded-lg p-1">
                    <button
                      onClick={() => setListViewType('enhanced')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        listViewType === 'enhanced' 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Enhanced
                    </button>
                    <button
                      onClick={() => setListViewType('classic')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        listViewType === 'classic' 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Classic
                    </button>
                    <button
                      onClick={() => setListViewType('virtualized')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        listViewType === 'virtualized' 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Virtualized
                    </button>
                    <button
                      onClick={() => setListViewType('infinite')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        listViewType === 'infinite' 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Infinite
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area - Card-like design with softer borders */}
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-tertiary)]">
          {/* This inner div is the flex container for the message list and message view */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Message List - Softer styling */}
            <div className={`${
              currentMessage 
                ? 'w-1/3 flex-shrink-0' 
                : 'flex-1'
            } flex flex-col min-w-0 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-tertiary)]`}>
              {isThreadedView ? (
                <ThreadedMessageList />
              ) : (
                <>
                  {listViewType === 'enhanced' && <EnhancedMessageList />}
                  {listViewType === 'classic' && <MessageList />}
                  {listViewType === 'virtualized' && <VirtualizedMessageList />}
                  {listViewType === 'infinite' && <InfiniteScrollMessageList />}
                </>
              )}
            </div>

            {/* Message View - Card-like styling */}
            {currentMessage && (
              <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-tertiary)]">
                <MessageView />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Sidebar */}
      <MailContextSidebar 
        isOpen={isContextOpen}
        messageId={currentMessage?.id}
        onToggle={toggleContext}
      />

      {/* Phase 2.3 - Label Management Modals */}
      {/* Label Manager Modal */}
      <LabelManager
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
        onLabelCreated={handleLabelCreated}
        onLabelUpdated={handleLabelUpdated}
        onLabelDeleted={handleLabelDeleted}
      />

      {/* Label Settings Modal */}
      <LabelSettings
        isOpen={isLabelSettingsOpen}
        onClose={() => setIsLabelSettingsOpen(false)}
        onSettingsChange={updateLabelSettings}
        initialSettings={labelSettings}
      />

      {/* Label Picker Dropdown */}
      <LabelPicker
        messageIds={labelPickerState.messageIds}
        currentLabels={labelPickerState.currentLabels}
        isOpen={labelPickerState.isOpen}
        onClose={handleCloseLabelPicker}
        onLabelsChanged={handleLabelsChanged}
        triggerRef={labelPickerState.triggerRef}
      />

      {/* Compose Modal */}
      {isComposing && <ComposeModal />}

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onSearch={(query) => {
          console.log('Advanced search initiated:', query);
          setIsAdvancedSearchOpen(false);
        }}
      />
    </div>
  );
} 