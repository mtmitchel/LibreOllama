// Core Mail Components - Import Error Fix
// 
// NOTE: Any exports for non-existent components are commented out to prevent
// Vite import resolution errors. Uncomment when components are implemented.

// Components that don't exist yet (commented out to prevent import errors)
// export { MailHeader } from './MailHeader'; // TODO: Component not implemented yet
// export { ThreadView } from './ThreadView'; // TODO: Component not implemented yet
// export { AttachmentList } from './AttachmentList'; // TODO: Component not implemented yet
// export { MailErrorBoundary } from './MailErrorBoundary'; // TODO: Component not implemented yet
// export { MailLayout } from './MailLayout'; // TODO: Component not implemented yet

// Available Mail Components
export { MessageList } from './MessageList';
export { VirtualizedMessageList } from './VirtualizedMessageList';
export { InfiniteScrollMessageList } from './InfiniteScrollMessageList';
export { ThreadedMessageList } from './ThreadedMessageList';
export { MessageView } from './MessageView';
export { EnhancedMessageRenderer } from './EnhancedMessageRenderer';
export { EnhancedMessageActions } from './EnhancedMessageActions';
export { EnhancedRichTextEditor } from './EnhancedRichTextEditor';
export { EnhancedRecipientInput } from './EnhancedRecipientInput';
export { EnhancedAttachmentHandler } from './EnhancedAttachmentHandler';
export { ComposeModal } from './ComposeModal';
export { MailSidebar } from './MailSidebar';
export { AttachmentPreviewModal } from './AttachmentPreviewModal';
export { AttachmentDownloadButton } from './AttachmentDownloadButton';

// Phase 2.1 - Enhanced Search Components
export { EnhancedSearchBar } from './EnhancedSearchBar';
export { AdvancedSearchModal } from './AdvancedSearchModal';

// Phase 2.2 - Email Action Components
export { EmailActionBar } from './EmailActionBar';
export { MessageContextMenu } from './MessageContextMenu';
export { EnhancedMessageItem } from './EnhancedMessageItem';
export { EnhancedMessageList } from './EnhancedMessageList';

// Phase 2.3 - Label Management Components
export { default as LabelManager } from './LabelManager';
export { default as LabelPicker } from './LabelPicker';
export { default as LabelFilter } from './LabelFilter';
export { default as LabelSettings } from './LabelSettings';

// Phase 2.4 - Advanced Search Components
export { default as SearchOperators } from './SearchOperators';
export { default as AdvancedSearchFilters } from './AdvancedSearchFilters';
export { default as SearchSuggestions } from './SearchSuggestions';
export { default as SavedSearches } from './SavedSearches';
export { default as SearchResults } from './SearchResults'; 