**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

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

- Secure OAuth2 authentication and multi-account management.
- Fetching, displaying, and parsing of email messages.
- Basic email operations (reply, forward, delete).
- Rate limiting and robust error handling on the backend.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Bugfix:** Resolve the 2 failing backend tests related to minor OAuth configuration issues.
- [ ] **Bugfix:** Fix frontend test failures that appear to be caused by race conditions between data fetching and test assertions.
- [ ] **Setup:** Finalize and document the required environment variable configuration for OAuth (`.env` file).

### MVP Must-Haves

- [x] **Single-Account Auth:** Secure OAuth2 login for a single user. *(Existing)*
- [ ] **Inbox Threading:** A threaded view for conversations.
- [x] **Core Email Actions:** Compose, reply, forward, delete. *(Existing)*
- [ ] **Attachments:** Ability to download and upload attachments.
- [ ] **Basic Search:** Search emails by sender or subject.

### Post-MVP Enhancements

- [ ] **Canned Responses:** Save and reuse common email replies.
- [ ] **Scheduled Send:** Schedule an email to be sent at a future time.
- [ ] **Email Categorization:** Automatic sorting into tabs like "Primary" or "Promotions."

### Future Vision & "Wow" Delighters

- [ ] **AI-Powered Assistance:** Smart replies and email summarization.
- [ ] **Intelligent Triage:** Automatically prioritize emails from important senders.
- [ ] **Offline Compose:** Write and queue emails to be sent when back online.
- [ ] **Calendar Integration:** A shortcut to create a calendar event from an email.

### UX/UI Improvements

- [ ] **Multi-Account UI:** Improve the UI for switching between and managing multiple linked Gmail accounts.
- [ ] **Rich Text Editor:** Enhance the email composition window with a full-featured rich text editor (bold, italics, lists, etc.).
- [ ] **Attachment Handling:** Design a more intuitive and powerful interface for viewing, downloading, and managing email attachments.

### Technical Debt & Refactoring

- [ ] **Backend Warnings:** Address the 49 compiler warnings in the backend Rust code (mostly unused imports and dead code).
- [ ] **Offline Support:** Refactor the frontend store (`mailStore.ts`) to handle offline access more gracefully, perhaps with more aggressive caching or a local-first approach.
- [ ] **API Error Feedback:** Improve the error handling on the frontend to provide more specific and helpful feedback to the user when an API call fails. 