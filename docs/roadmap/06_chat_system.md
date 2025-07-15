**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Chat System Roadmap

This document provides a comprehensive overview of the Chat System feature, including its current implementation details and future development plans.

## Design Assets

- **Mockup:** [chats mockup.png](../../design/mockups/chats%20mockup.png)
- **Spec:** [chat-hub.html](../../design/specs/chat-hub.html)

## Current Implementation

The chat system has a functional frontend UI with backend services implemented, but **lacks integration between frontend and backend**. The frontend currently uses mock data and has no AI integration.

### Frontend Architecture

- **UI Components:** The UI is located in `src/features/chat/components/` and includes:
    - `Chat.tsx`: The main chat interface.
    - `ConversationList.tsx`: A sidebar for managing different conversations.
    - `ChatMessageBubble.tsx`: A component for displaying individual messages, styled with the "ghost" low-fatigue design.
    - `ChatInput.tsx`: A flexible input component for typing messages.
- **Mock Data:** Frontend uses mock data from `src/core/lib/chatMockData.ts` and is **not connected to backend services**.
- **State Management:** State is managed locally within React components using mock data arrays. No integration with backend chat services.
- **No AI Integration:** Currently has no connection to Ollama or any AI service for generating responses.

### Backend Architecture

- **Database Implementation:** Full backend implementation exists in `src-tauri/src/commands/chat/` with:
    - `sessions.rs`: Complete chat session and message management
    - Database operations for sessions, messages, and statistics
    - Proper error handling and type conversion
- **Tauri Commands:** Implemented commands include:
    - `create_session`: Create new chat sessions
    - `get_sessions`: Retrieve all chat sessions
    - `send_message`: Send and persist messages
    - `get_session_messages`: Retrieve conversation history
    - `delete_session`: Delete chat sessions
    - `get_database_stats`: Database statistics

### Critical Implementation Gaps

- **Frontend-Backend Disconnection:** The existing frontend UI components use mock data and do not call any backend Tauri commands.
- **No Ollama Integration:** No connection to local Ollama instance for AI responses.
- **No AI Response Generation:** Messages are displayed but no AI responses are generated or processed.
- **No Persistent Storage Integration:** Frontend state is not persisted to the database backend.

### Implemented Features

- Complete chat UI with conversation list, message bubbles, and input
- Mock conversation management UI (create, select, pin, delete)
- Backend database schema and persistence layer for sessions and messages
- Chat session CRUD operations (backend only)
- Message history storage and retrieval (backend only)
- Database statistics and health monitoring (backend only)
- Responsive layout with collapsible sidebars
- Ghost-style message bubbles for clean, low-fatigue design

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### MVP Must-Haves

- [x] **Chat UI:** Complete chat UI with conversation list, message bubbles, and input. *(Existing)*
- [x] **Backend Database Services:** Backend database storage for chat history. *(Existing)*
- [ ] **Frontend-Backend Integration:** Connect the existing frontend UI to the existing backend services. *(Critical Gap)*
- [ ] **Ollama Integration:** Connect to local Ollama instance for AI responses, including model management, streaming responses, and error handling. *(Missing)*
- [ ] **Message Persistence:** Integrate frontend message state with backend database operations. *(Missing)*
- [ ] **AI Response Generation:** Implement AI response pipeline from user messages to Ollama and back to UI. *(Missing)*

### Post-MVP Enhancements

- [ ] **Message Editing & Reactions:** Implement message editing and emoji reactions functionality.
- [ ] **File Attachments:** Add support for uploading and attaching files to messages.
- [ ] **Multi-User Chat:** Implement chat rooms for multi-user conversations.
- [ ] **Plugin System:** Develop a plugin system for custom slash commands.

### Future Vision & "Wow" Delighters

- [ ] **Context-Aware Memory:** Enable the AI to remember context from earlier in a conversation.
- [ ] **Inline Code Execution:** Add previews for executable code snippets.
- [ ] **"Create Task from Message":** A shortcut to create a new task directly from a chat message.
- [ ] **Slash Command Macros:** Custom slash commands that can trigger personal macros or workflows.

### UX/UI Improvements

- [ ] **Loading Indicators:** Add loading skeletons and indicators while waiting for AI responses.
- [ ] **Code Block Handling:** Improve code block rendering with syntax highlighting and a "copy" button.
- [ ] **Message Animations:** Animate the appearance of new messages to make the conversation feel more dynamic.

### Technical Debt & Refactoring

- [ ] **Dedicated Chat Store:** Create a dedicated Zustand store (`chatStore.ts`) to manage all chat-related state efficiently.
- [ ] **Frontend-Backend Integration:** Connect the existing frontend components to the existing backend services.
- [ ] **AI Service Integration:** Integrate with Ollama or other AI services for generating responses.
- [ ] **API Contract:** Create a clear, documented API contract between the frontend and backend chat services.
- [ ] **Test Coverage:** Add comprehensive tests for the chat functionality, including backend unit tests and frontend integration tests. 

### Phase 3 Hardening Tests

- **Concurrent message dispatch:** simulate 50 rapid user + agent messages and ensure store order consistency and no dropped updates.
- **Cold-boot persistence:** open a conversation, reload app, verify messages and scroll position restored.
- **Accessibility audit:** ensure screen-reader labels for message bubbles and input, plus keyboard shortcuts work (Up arrow to edit last message, etc.). 