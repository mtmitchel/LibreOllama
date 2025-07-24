// Core Mail Components - Import Error Fix
// 
// NOTE: Any exports for non-existent components are commented out to prevent
// Vite import resolution errors. Uncomment when components are implemented.

// Available Mail Components
export { MailErrorBoundary } from './MailErrorBoundary';
export { MailLayout, MailSidebarLayout, MailThreeColumnLayout, MailFullLayout } from './MailLayout';
// Archived components - replaced by EnhancedMessageList
// export { MessageList } from './_archive/MessageList';
// export { VirtualizedMessageList } from './_archive/VirtualizedMessageList';
// export { InfiniteScrollMessageList } from './_archive/InfiniteScrollMessageList';
// export { ThreadedMessageList } from './_archive/ThreadedMessageList';
export { MailSidebar } from './MailSidebar';
export { MessageView } from './MessageView';
export { default as ComposeModal } from './ComposeModal';
export { EnhancedSearchBar } from './EnhancedSearchBar';
export { SimpleAdvancedSearch } from './SimpleAdvancedSearch';
export { EnhancedMessageList } from './EnhancedMessageList';
export { MailContextSidebar } from './MailContextSidebar';
export { default as LabelPicker } from './LabelPicker';
export { default as LabelFilter } from './LabelFilter';
export { MailToolbar } from './MailToolbar';
// Test component - archived
// export { GmailTauriTestComponent } from './_archive/GmailTauriTestComponent';
export { default as SearchSuggestions } from './SearchSuggestions';
export { default as SavedSearches } from './SavedSearches';
// Archived - replaced by StreamlinedLabelManager
// export { default as UnifiedLabelManager } from './_archive/UnifiedLabelManager';
// export { default as LabelManager } from './_archive/LabelManager';
export { default as LabelSettings } from './LabelSettings';
export { ErrorDisplay, SuccessMessage, LoadingMessage } from './ErrorDisplay';
export { MailStoreProvider } from './MailStoreProvider';
export { InlineReply } from './InlineReply'; 
