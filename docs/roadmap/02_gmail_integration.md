**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Gmail Integration Roadmap

This document provides a comprehensive overview of the Gmail Integration feature, including its current implementation details and future development plans.

## Design Assets

- **Mockup:** None available in `design/mockups/`.
- **Spec:** None available in `design/specs/`.

## Current Implementation

The Gmail integration connects directly to the Google API, providing real email functionality within the application. It has a robust service-oriented architecture.

### Backend Architecture (Rust)

- **Core Services:** The backend is built in Rust within the `src-tauri/src/services/gmail/` directory. It features a clean separation of concerns:
    - `auth_service.rs`: Handles the entire OAuth2 flow, including token acquisition, refresh, and secure storage in the OS keyring.
    - `api_service.rs`: Manages all direct communication with the Gmail API for fetching messages, labels, etc.
    - `cache_service.rs`: Provides a caching layer to reduce API calls and improve performance.
- **Tauri Commands:** The `src-tauri/src/commands/gmail/` directory exposes the backend services to the frontend via Tauri commands (e.g., `get_gmail_labels`, `send_email`).
- **Error Handling:** A dedicated error module ensures that API errors, network issues, and authentication failures are handled gracefully.
- **Multi-Account Support:** The backend is designed to support multiple Gmail accounts, storing tokens and data separately for each.

### Frontend Architecture

- **Service Layer:** A frontend service (`gmailApiService.ts`) acts as a bridge, calling the Tauri commands to interact with the backend. It centralizes all frontend-to-backend communication.
- **State Management:** The `mailStore.ts` (a Zustand store) manages all mail-related state, including accounts, messages, labels, and UI state.
- **Components:** The UI is composed of various React components in `src/features/mail/components/` for displaying the mailbox, composing messages, handling attachments, etc.

### Implemented Features

**Authentication & Security:**
- ✅ Secure OAuth2 authentication with PKCE flow
- ✅ Multi-account management with account switching
- ✅ Robust account removal with backend OAuth token revocation
- ✅ Token storage in OS keyring (secure)
- ✅ Automatic token refresh mechanism
- ✅ XSS protection with DOMPurify sanitization
- ✅ Automatic message loading after authentication

**Core Email Functionality:**
- ✅ Fetching, displaying, and parsing of email messages
- ✅ Threaded conversation view with expand/collapse
- ✅ Basic email operations (compose, reply, forward, delete)
- ✅ Rich text email composition with TipTap editor
- ✅ Full attachment support (upload, download, preview)
- ✅ Advanced search with Gmail-style operators
- ✅ Label management (create, edit, delete, apply)
- ✅ Rate limiting and robust error handling

**UI Components:**
- ✅ Unified inbox with message list
- ✅ Compose modal with rich text editor
- ✅ Attachment preview modal (images, videos, PDFs)
- ✅ Context menu for message actions
- ✅ Search bar with suggestions and filters
- ✅ Label picker and management UI
- ✅ Security warnings for suspicious attachments

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Bugfix:** Resolve failing backend tests:
  - OAuth configuration test (missing `oauth.client_id` environment variable)
  - Gmail scopes configuration test (expected scopes mismatch)
  - Database schema tests (some tables may be missing)
- [ ] **Code Quality:** Address compiler warnings in backend Rust code (unused functions and dead code)
- [ ] **Setup:** Finalize and document the required environment variable configuration for OAuth (`.env` file)

### MVP Must-Haves

- [x] **Single-Account Auth:** Secure OAuth2 login for a single user. *(Existing)*
- [x] **Inbox Threading:** A threaded view for conversations. *(Completed - ThreadedMessageList.tsx)*
- [x] **Core Email Actions:** Compose, reply, forward, delete. *(Existing)*
- [x] **Attachments:** Ability to download and upload attachments. *(Completed - EnhancedAttachmentHandler.tsx, AttachmentPreviewModal.tsx)*
- [x] **Basic Search:** Search emails by sender or subject. *(Completed - Advanced search system implemented)*

### Additional Completed Features

- [x] **Label Management:** Complete CRUD operations for Gmail labels *(Phase 2.3)*
- [x] **Advanced Search:** Gmail-style search operators, filters, and saved searches *(Phase 2.4)*
- [x] **Rich Text Editing:** Full-featured email composition with formatting
- [x] **Attachment Preview:** Comprehensive preview system for images, videos, PDFs
- [x] **Message Threading:** Full conversation threading with expand/collapse functionality

### Code-Level Cleanup & Feature Completion
- [ ] **Implement Email Actions:** Wire up the UI for `Reply`, `Reply All`, and `Forward` functionality in `MessageContextMenu.tsx`.
- [ ] **Implement Print Functionality:** Add the print logic in `MessageContextMenu.tsx`.
- [ ] **Implement Mark as Important:** Connect the "Mark as important" action in `MessageContextMenu.tsx` to the backend.
- [ ] **Implement Label Management UI:** Hook up the "Manage labels" action in `MessageContextMenu.tsx`.
- [ ] **Finalize Label Settings:** Replace the placeholder API call in `LabelSettings.tsx` with a real one to save user settings.
- [ ] **Enable Search Suggestion Removal:** Implement the removal logic for recent and saved searches in `SearchSuggestions.tsx`.
- [ ] **Add Tag Support for Saved Searches:** Extend the `SearchQuery` type and UI in `SavedSearches.tsx` to support tags.
- [ ] **Implement Tag Filtering:** Add logic to filter saved searches by tag in `SavedSearches.tsx`.
- [ ] **Add Toast Notifications:** Implement user feedback toasts for actions like copying a link or saving a search.
- [ ] **Implement Real Context:** Fetch and display real contextual data in `MailContextSidebar.tsx` based on the selected message.

### Post-MVP Enhancements

- [ ] **Canned Responses:** Save and reuse common email replies.
- [ ] **Scheduled Send:** Schedule an email to be sent at a future time.
- [ ] **Email Categorization:** Automatic sorting into tabs like "Primary" or "Promotions."

### Phase 4 - Future Iteration (Advanced Features & AI)

**Phase 4.1: AI-Powered Features**
- [ ] **Smart Replies:** AI-generated contextual reply suggestions based on email content
- [ ] **Email Summarization:** Automatic summarization of long emails and conversation threads
- [ ] **Intelligent Triage:** AI-powered email prioritization and sender importance scoring

**Phase 4.2: Advanced Features**
- [ ] **Enhanced Scheduled Send:** Advanced scheduling with timezone support and send conditions
- [ ] **Advanced Canned Responses:** Template management with variables and conditional logic
- [ ] **Smart Email Categorization:** Machine learning-based email sorting and filtering

**Phase 4.3: Calendar Integration**
- [ ] **Email-to-Event Creation:** One-click calendar event creation from email content
- [ ] **Meeting Scheduling:** Integrated scheduling assistant with availability checking
- [ ] **Smart Meeting Detection:** Automatic detection of meeting requests and calendar conflicts

### Future Vision & "Wow" Delighters

- [ ] **AI-Powered Assistance:** Smart replies and email summarization.
- [ ] **Intelligent Triage:** Automatically prioritize emails from important senders.
- [ ] **Offline Compose:** Write and queue emails to be sent when back online.
- [ ] **Calendar Integration:** A shortcut to create a calendar event from an email.

### UX/UI Improvements

- [ ] **Multi-Account UI:** Improve the UI for switching between and managing multiple linked Gmail accounts.
- [ ] **Rich Text Editor:** Enhance the email composition window with a full-featured rich text editor (bold, italics, lists, etc.).
- [ ] **Attachment Handling:** Design a more intuitive and powerful interface for viewing, downloading, and managing email attachments.

### Phase 3 Hardening Tests

- **OAuth token-expiry & refresh tests:** simulate `401 invalid_grant`, ensure automatic refresh and UI re-auth banner.
- **XSRF rejection tests:** mock `403` XSRF response and assert proper logout & user notification.
- **Contract tests (Tauri ↔ Frontend):** invoke `send_email`, `get_gmail_labels` via mocked `tauri.invoke` and assert store updates.
- **Cold-boot persistence:** log in, persist tokens, reload app, verify account/session re-hydration.
- **Accessibility audit:** axe-core scan of inbox, compose modal, and sidebar – zero critical issues.

### Technical Debt & Refactoring

- [ ] **Backend Warnings:** Address the 49 compiler warnings in the backend Rust code (mostly unused imports and dead code).
- [ ] **Offline Support:** Refactor the frontend store (`mailStore.ts`) to handle offline access more gracefully, perhaps with more aggressive caching or a local-first approach.
- [ ] **API Error Feedback:** Improve the error handling on the frontend to provide more specific and helpful feedback to the user when an API call fails. 

### Missing Components Documentation

**Authentication & Google Integration:**
- `GoogleAuthModal.tsx` - Google OAuth authentication modal with scopes for Gmail, Calendar, and Tasks
- `GoogleAuthProvider.tsx` - Authentication context provider
- `LoginStatus.tsx` - Authentication status indicator

**Advanced Search Components:**
- `SimpleAdvancedSearch.tsx` - Advanced search interface replacing complex filters
- `UnifiedLabelManager.tsx` - Unified label management system
- `SearchSuggestions.tsx` - Search suggestions and autocomplete
- `SavedSearches.tsx` - Saved search management

**UI Enhancement Components:**
- `ErrorDisplay.tsx` - Error display for Gmail operations
- `SuccessMessage.tsx` - Success feedback component
- `LoadingMessage.tsx` - Loading state indicators
- `MessageContextMenu.tsx` - Context menu for message actions
- `AttachmentSecurityWarning.tsx` - Security warnings for attachments

**Compose & Messaging:**
- `ComposeModal.tsx` - Full-featured email composition modal
- `EnhancedAttachmentHandler.tsx` - Comprehensive attachment handling
- `AttachmentPreviewModal.tsx` - Attachment preview functionality 