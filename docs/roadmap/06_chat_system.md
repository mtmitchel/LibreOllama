**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Chat System Roadmap

This document provides a comprehensive overview of the Chat System feature, including its current implementation details and future development plans.

## Design Assets

- **Mockup:** [chats mockup.png](../../design/mockups/chats%20mockup.png)
- **Spec:** [chat-hub.html](../../design/specs/chat-hub.html)

## Current Implementation (Prototype)

The chat system currently exists as a **fully client-side prototype** with a well-developed UI, but no backend functionality.

### Frontend Architecture

- **UI Components:** The UI is located in `src/features/chat/components/` and is feature-rich, including:
    - `Chat.tsx`: The main chat interface.
    - `ConversationList.tsx`: A sidebar for managing different conversations.
    - `ChatMessageBubble.tsx`: A component for displaying individual messages, styled with the "ghost" low-fatigue design.
    - `ChatInput.tsx`: A flexible input component for typing messages.
- **Mock Data:** The entire chat experience is powered by mock data from `src/core/lib/chatMockData.ts`. There is no connection to a real AI or backend service.
- **State Management:** The state is managed locally within the React components. There is no centralized store for chat data yet.

### Backend Architecture

- **No Backend Implementation:** There are currently **no backend services, Tauri commands, or database tables** for the chat system. The `src-tauri/src/commands/chat/` directory exists but is likely a placeholder.

### Implemented Features (UI Only)

- A complete chat UI with conversation list, message bubbles, and input.
- Conversation management UI (create, select, pin, delete).
- A responsive layout with collapsible sidebars.
- Ghost-style message bubbles for a clean, low-fatigue design.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### MVP Must-Haves

- [x] **Chat UI:** A complete chat UI with a conversation list, message bubbles, and input. *(Existing Prototype)*
- [ ] **Persistent Local History:** Connect the frontend to the backend to store chat history in the database.
- [ ] **AI Integration Stub:** Integrate with a real AI backend (e.g., local Ollama instance) to provide responses, replacing mock data.

### Post-MVP Enhancements

- [ ] **Message Editing & Reactions:** Implement the backend logic for editing messages and adding emoji reactions.
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
- [ ] **Backend Implementation:** This is the most critical step.
    - [ ] Design and implement the database schema for storing conversations and messages.
    - [ ] Create backend services in Rust for all chat operations (sending messages, fetching history).
    - [ ] Expose these services to the frontend via new Tauri commands in `src-tauri/src/commands/chat/`.
- [ ] **API Contract:** Create a clear, documented API contract between the frontend and the backend chat service.
- [ ] **Test Coverage:** Add comprehensive tests for the chat functionality, including backend unit tests and frontend integration tests. 