import React, { useState, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import { MailToolbar } from '../../features/mail/components/MailToolbar';
import { EnhancedSearchBar, EnhancedMessageList } from '../../features/mail/components';
import { MailContextSidebar } from '../../features/mail/components/MailContextSidebar';
import { ComposeModal } from '../../features/mail/components';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { Tag } from 'lucide-react';

export default function Mail() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const { isComposing } = useMailStore();
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

  const toggleMailSidebar = () => setIsMailSidebarOpen(!isMailSidebarOpen);
  const toggleContext = () => setIsContextOpen(!isContextOpen);

  // Placeholder functions for missing handlers
  const handleOpenLabelPicker = () => {};

  return (
    <div className="flex h-full bg-primary">
      {/* Mail Sidebar */}
      <MailSidebar 
        isOpen={isMailSidebarOpen}
        onToggle={toggleMailSidebar}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1">
        <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          
          {/* Enhanced Search Bar */}
          <div className="bg-bg-tertiary shrink-0 rounded-t-xl p-4">
            <EnhancedSearchBar 
              onAdvancedSearch={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            />
          </div>

          {/* Mail Toolbar */}
          <MailToolbar />

          {/* View Toggle Options */}
          <div className="border-border-primary shrink-0 border-b bg-secondary px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-accent-primary" />
                  <span className="text-sm font-medium text-primary">View:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="viewType"
                      checked={isThreadedView}
                      onChange={() => setIsThreadedView(true)}
                      className="text-accent-primary focus:ring-accent-primary"
                    />
                    <span className="text-sm text-secondary">Threaded</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="viewType"
                      checked={!isThreadedView}
                      onChange={() => setIsThreadedView(false)}
                      className="text-accent-primary focus:ring-accent-primary"
                    />
                    <span className="text-sm text-secondary">Flat</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-secondary">List Type:</label>
                <select 
                  value={listViewType}
                  onChange={(e) => setListViewType(e.target.value as 'enhanced')}
                  className="border-border-primary rounded border bg-tertiary px-2 py-1 text-sm text-primary"
                >
                  <option value="enhanced">Enhanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Message List Content */}
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1">
              <EnhancedMessageList />
            </div>
          </div>
        </div>
      </div>

      {/* Context Sidebar */}
      <MailContextSidebar 
        isOpen={isContextOpen}
        onToggle={toggleContext}
      />

      {/* Compose Modal */}
      {isComposing && (
        <ComposeModal />
      )}
    </div>
  );
} 