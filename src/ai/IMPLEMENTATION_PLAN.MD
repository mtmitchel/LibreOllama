
# LibreOllama Dashboard: Implementation Plan

This document outlines the development roadmap and technical considerations for building the LibreOllama Dashboard, a self-hosted, Next.js-based productivity hub. It integrates local LLMs (via Ollama), customizable AI agents, workflow automation (via n8n), and external tool integrations (via Model Context Protocol, MCP).

## 1. Executive Summary (Recap from Unified Guide)

LibreOllama Dashboard aims to be a privacy-first, AI-driven productivity hub for technically savvy users. Key features include local LLM integration, customizable AI agents, n8n workflow automation, and MCP server support. The primary challenge is transitioning prototypes into robust, secure, and scalable features while maintaining a cohesive user experience.

---

## 2. Product Design & Feature Implementation Roadmap

### 2.1 Dashboard & Widgets
*   **Current State**: Basic widgets (Tasks Progress, Calendar, Email Snippets, Time Blocking Interface) with mock data. UI for showing/hiding widgets and mock custom widget creation. Dismissible header card.
*   **Implementation Steps**:
    1.  **Dynamic Grid System**: Integrate a library like `react-grid-layout` for draggable and resizable widgets.
    2.  **Layout Persistence**: Use `localStorage` or backend to save and restore widget layouts and visibility preferences.
    3.  **Widget Configuration**: Allow users to configure individual widget settings (e.g., specific calendar for Calendar Overview).
    4.  **New Widget Templates**:
        *   AI-Powered Summaries: Widget to summarize selected notes or chat sessions.
        *   Task Suggestions: Widget to suggest tasks based on calendar events or note content.
        *   Habit Tracking: Simple habit tracking widget.
*   **Key Technologies**: `react-grid-layout`, `localStorage`/Backend DB.

### 2.2 Chat
*   **Current State**: Two-panel layout for chat sessions. Basic message display (text, image, mock whiteboard sketch embedding). Pin/unpin, mock export, delete sessions. Tag support.
*   **Implementation Steps**:
    1.  **Real-time Backend**: Integrate with Supabase (or similar like Firebase Realtime Database) for real-time messaging and chat history persistence.
    2.  **Markdown & Emoji Support**: Implement a Markdown parser (e.g., `react-markdown`) for chat messages. Add an emoji picker.
    3.  **Agent Switching**: Allow users to select and switch between different configured AI agents (from the Agent Builder) within a chat session. The selected agent's persona/instructions should be used for generating responses.
    4.  **Streaming Responses**: Ensure responses from Ollama/Genkit stream into the chat interface.
*   **Key Technologies**: Supabase (or alternative), `react-markdown`, Genkit.

### 2.3 Notes & Rich Text Editor
*   **Current State**: Notes management (CRUD), mock image embedding, placeholder rich text editor toolbar. Tag support. Mock export.
*   **Implementation Steps**:
    1.  **Rich Text Editor Integration**: Replace the current `Textarea` with BlockNote or similar.
    2.  **Collaborative Editing**: Integrate Yjs with chosen editor for real-time collaborative editing.
    3.  **Feature Implementation**:
        *   Slash Commands: For quick formatting and block insertion.
        *   Backlinks: Ability to link between notes (`[[Note Name]]`).
        *   Document Version History: (Long-term) Store and allow rollback of note versions.
    4.  **Persistence**: Store note content (editor's JSON structure) in Supabase/SQLite.
*   **Key Technologies**: BlockNote/Tiptap/Lexical, Yjs, Supabase/SQLite.

### 2.4 Whiteboards
*   **Current State**: Whiteboard management (CRUD), mock editor with placeholder toolbar including line, arrow, image, link. Tag support. Mock export.
*   **Implementation Steps**:
    1.  **Real-time Drawing Library**: Integrate a library like `tldraw`, `perfect-freehand` with Liveblocks or Convex for state synchronization.
    2.  **Feature Implementation**:
        *   Multi-user drawing and cursors.
        *   Shape manipulation, text tool.
        *   Image pasting from clipboard.
        *   Object grouping.
        *   Linking whiteboard sketches to chat sessions.
    3.  **Persistence**: Store whiteboard state (e.g., JSON or library-specific format) using Liveblocks/Convex or Supabase.
*   **Key Technologies**: `tldraw`/`perfect-freehand`, Liveblocks/Convex.

### 2.5 Calendar & Tasks
*   **Current State**: Google Calendar-like interface with Day/Week/Month views. Event creation/editing modal. Collapsible left/right sidebars for calendar options and task scheduling. Drag-and-drop tasks to calendar. Tag support for tasks.
*   **Implementation Steps**:
    1.  **Backend for Events & Tasks**: Use Supabase/SQLite to store calendar events and tasks.
    2.  **FullCalendar Integration (Optional but Recommended for Advanced Features)**: Consider replacing the custom calendar views with a robust library like FullCalendar if advanced features (complex recurring events, resource views, printing) are critical. This would be a significant refactor.
    3.  **Recurring Tasks/Events**: Implement logic for creating and displaying recurring items.
    4.  **Deadline Reminders**: (Requires notification system) Implement reminders for task due dates and event start times.
    5.  **Task-Agent Recommendations**: (Advanced AI feature) Suggest scheduling tasks based on AI analysis of workload or deadlines.
*   **Key Technologies**: Supabase/SQLite, FullCalendar (optional).

### 2.6 AI Agent Builder
*   **Current State**: UI for configuring agent (name, avatar, instructions, model, mock tools, starting prompts, tags, RAG placeholder). Pinning agents. Test modal calls a Genkit flow using agent instructions and starting prompts. UI for mock custom tool definition.
*   **Implementation Steps**:
    1.  **Agent Persistence**: Store `AgentConfig` in Supabase/SQLite.
    2.  **Genkit Flow Integration**:
        *   Modify `researchAssistantFlow` (or create new flows) to dynamically use the agent's selected model, tools, and instructions.
        *   Implement actual Genkit tools (e.g., real web search).
    3.  **Knowledge (RAG) Implementation**:
        *   Enable file uploads (text, PDF, markdown).
        *   Set up a vector database (e.g., Supabase pgvector, Pinecone, Weaviate).
        *   Implement embedding generation for uploaded files.
        *   Update Genkit flows to perform RAG: retrieve relevant context from the vector store based on user query and inject into the LLM prompt.
    4.  **UI Enhancements**:
        *   Tabbed modal or multi-step wizard for a cleaner configuration experience.
        *   Live preview of agent responses during configuration.
*   **Key Technologies**: Genkit, Supabase/SQLite, Vector Database (pgvector, etc.), FilePond/Uppy for uploads.

### 2.7 n8n Integration
*   **Current State**: UI page for mock n8n connection (URL, auth method - API key, basic) and listing mock workflows. Dismissible header card.
*   **Implementation Steps**:
    1.  **Backend API for n8n**: Create Next.js API routes or server actions to:
        *   Securely store n8n connection details (encrypted).
        *   Fetch workflow list from user's n8n instance.
        *   Trigger n8n workflows (via webhook URL or n8n API).
    2.  **UI for Workflow Mapping**: Design UI where users can map certain application events or AI agent actions to trigger specific n8n workflows, passing parameters.
    3.  **Real-time Status Updates**: Implement webhook endpoint in Next.js to receive status updates back from n8n workflows and display them in the UI.
    4.  **Agent Invocation**: Allow AI agents (via a Genkit tool) to call the backend API to trigger n8n workflows.
*   **Key Technologies**: Next.js API Routes/Server Actions, n8n API.

### 2.8 MCP Integration
*   **Current State**: Placeholder page, settings section, and sidebar navigation. Dismissible header card.
*   **Implementation Steps**:
    1.  **MCP Client Library**: Integrate an MCP client library in the Next.js backend.
    2.  **Tool Discovery Explorer UI**:
        *   Fetch and display available tools from connected MCP servers.
        *   Show tool metadata (name, description, input/output schema).
        *   Display mock logs (last access, success/failure).
    3.  **MCP Server Configuration UI (Settings)**: Allow users to add, edit, and remove MCP server configurations (persisted securely).
    4.  **Agent Tool for MCP**: Create a Genkit tool that allows AI agents to discover and invoke tools from configured MCP servers.
    5.  **Security**:
        *   Implement UI for scoped access policies per agent (which MCP tools an agent can use).
        *   Confirmation prompts for sensitive MCP tool invocations.
        *   Dynamic invocation tracing/logging in the UI.
*   **Key Technologies**: MCP Client Library, Next.js API Routes/Server Actions.

### 2.9 Settings & General UI
*   **Current State**: Comprehensive settings panel with mock functionalities for Google APIs, Ollama (list/delete models), MCP, External LLM API Keys, Appearance, Notifications, Data & Privacy, About. Dismissible header cards.
*   **Implementation Steps**:
    1.  **Default Configurations**: Implement saving and loading of actual default settings (e.g., default agent, default theme).
    2.  **User-Defined Themes**: Integrate `next-themes` for light/dark/system theme switching. Allow customization of primary/accent colors if desired.
    3.  **Analytics Toggles**: (If analytics are added) UI to enable/disable analytics.
    4.  **Onboarding Checklist**: Guide new users through key setup steps (connecting Ollama, creating first agent, etc.).
    5.  **Keyboard Shortcuts Manager**: Display available keyboard shortcuts and allow customization.
    6.  **User Data Backup/Export**: Implement actual functionality to export user data (notes, configurations, etc.) as JSON or other formats.
*   **Key Technologies**: `next-themes`, `localStorage`/Supabase for settings.

---

## 3. Technical Architecture (Recap & Enhancements)

### 3.1 Next.js Best Practices
*   **Current**: Using App Router, Server Components by default. Sentence case for UI text.
*   **To Implement/Verify**:
    *   Modular structure by domain (already partially done, continue refining).
    *   Utilize `Suspense` for loading states and streaming for progressive UI hydration.
    *   Analyze bundle sizes and apply tree-shaking. Lazy-load heavy third-party libraries (e.g., rich text editor, whiteboard library, FullCalendar if used).

### 3.2 Local LLM Integration (Ollama via Genkit)
*   **Current**: Genkit setup with Google AI plugin. Basic `researchAssistantFlow` exists.
*   **Implementation Steps**:
    1.  **Ollama Model Management (Settings UI)**:
        *   Connect to Ollama API to list available local models.
        *   Allow pulling new models.
        *   Allow deleting local models.
    2.  **Model Warming/Keep-Alive**: Implement a background job or scheduled task to periodically ping frequently used Ollama models to keep them in memory.
    3.  **Request Queuing & Concurrency**: For Ollama calls via Genkit, investigate if Genkit or the underlying HTTP client handles concurrency. If not, implement a simple queue system in server actions to limit concurrent requests to Ollama, especially if running on resource-constrained hardware.
    4.  **Fallback Modes**: If a GPU model call fails (e.g., OOM), have a strategy to retry with a CPU-only model or a smaller model.
    5.  **Typed Schemas**: Continue using Zod schemas for Genkit flow inputs/outputs to ensure data integrity with Ollama responses.

### 3.3 Data Caching and Persistence
*   **Current**: Mock data arrays.
*   **Implementation Steps**:
    1.  **Primary Database**: Choose and set up SQLite (for simplicity/self-hosting focus) or Supabase (for ease of use and real-time features).
    2.  **Schema Design**: Define database schemas for users, notes, chat sessions, agent configurations, calendar events, tasks, etc.
    3.  **Caching Strategy**:
        *   For frequently accessed, less frequently updated data (like agent list, folder structure), use Next.js ISR (Incremental Static Regeneration) or simple time-based revalidation.
        *   For highly dynamic data (chat messages, collaborative notes/whiteboards), rely on the real-time capabilities of Supabase or WebSockets with Liveblocks/Convex.
    4.  **Volatile Caching (Optional)**: Implement Redis for session management, rate limiting, or caching expensive API responses if performance bottlenecks are identified.
    5.  **Encryption**: Encrypt sensitive data like API keys or OAuth tokens stored in the database (e.g., using Node.js `crypto` module or database-level encryption if available).
    6.  **Token Management**: Implement secure storage and refresh logic for OAuth tokens.

---

## 4. Security Considerations (Recap & Enhancements)

### 4.1 User Content (Notes, Chat)
*   **Current**: Basic display.
*   **Implementation Steps**:
    1.  **Sanitization**: When rendering user-generated HTML (e.g., from a rich text editor or markdown), use `DOMPurify` on the client-side before rendering, and ideally also on the server-side if content is pre-rendered.
    2.  **Content Security Policy (CSP)**: Implement strict CSP headers in `next.config.js` to mitigate XSS risks.

### 4.2 API Keys & External Services (n8n, Google, etc.)
*   **Current**: Mock UI for API key input.
*   **Implementation Steps**:
    1.  **Backend Storage**: Store API keys and OAuth tokens encrypted in the database.
    2.  **Backend Proxy**: All calls to external services requiring API keys should be proxied through your Next.js backend API routes/server actions. Do not expose keys to the client.
    3.  **OAuth Flow**: Implement proper server-side OAuth 2.0 authorization code flow. Securely handle `redirect_uri` and token exchange.
    4.  **Token Refresh**: Implement logic to securely refresh OAuth tokens.
    5.  **Scope Limitation**: Request minimal necessary scopes when authenticating with services like Google.

### 4.3 MCP Security
*   **Current**: Placeholder UI.
*   **Implementation Steps**:
    1.  **Trust Levels for Tools (UI)**: Allow users to assign trust levels (e.g., "Trusted," "Sandboxed," "Requires Confirmation") to MCP tools or servers.
    2.  **Agent Invocation Authentication**: Ensure that when an agent invokes an MCP tool via the backend, the request is authenticated and authorized (e.g., confirming the agent belongs to the current user and has permission for that tool).
    3.  **UI Toggle for MCP Access**: Provide a global or per-agent setting to disable all MCP server access.

---

## 5. UX & Content Design (Recap & Enhancements)

### 5.1 Navigation & Information Architecture
*   **Current**: Persistent left nav with main modules. Collapsible right "Features Panel."
*   **To Implement/Refine**:
    *   Review current sidebar groups. Consider groups like "Workspace" (Dashboard, Chat, Notes, Whiteboards, Calendar, Tasks), "AI & Automation" (Agents, n8n Workflows, MCP Servers), "Administration" (Settings).
    *   Ensure consistent navigation patterns across all modules.

### 5.2 Progressive Disclosure
*   **Current**: Some use of modals and collapsible sections (e.g., dashboard customization).
*   **To Implement/Refine**:
    *   For complex forms (Agent Builder, Settings), use expandable sections or multi-step wizards to avoid overwhelming users.
    *   Implement the gamified onboarding checklist as suggested.

### 5.3 Visual Design & Consistency
*   **Current**: ShadCN based, light/dark theme via CSS variables. Sentence case for UI text.
*   **To Implement/Refine**:
    *   Adhere to a minimalist palette. Ensure themes are applied consistently.
    *   Increase touch targets for mobile usability where appropriate.
    *   Ensure agent messages, user messages, and system messages/logs are visually distinct in the chat interface and agent test modal.

### 5.4 Accessibility
*   **Current**: Standard HTML semantics, ShadCN components generally follow good practices.
*   **To Implement/Verify**:
    *   Thoroughly test keyboard navigability for all interactive elements.
    *   Add ARIA attributes where necessary for custom components or complex interactions.
    *   Implement "skip links" for users navigating by keyboard.
    *   Verify color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text).

---

## 6. Development Priorities (Roadmap from Unified Guide)

### Immediate (MVP Focus - Transforming Prototypes to Functional)
1.  **Functional Ollama-based Chat**:
    *   Implement actual Genkit flow for chat using selected Ollama model.
    *   Ensure robust request/response handling, including streaming.
    *   Error handling for Ollama connection issues.
    *   Persistence of chat sessions and messages (Supabase/SQLite).
2.  **Note Editor with Collaborative Support**:
    *   Integrate BlockNote & Yjs.
    *   Implement persistence of notes.
3.  **Minimal Calendar + Drag-and-Drop Kanban**:
    *   Backend persistence for events and tasks (Supabase/SQLite).
    *   Refine drag-and-drop from Kanban to Calendar to correctly create/update events.
4.  **Basic n8n Webhook Execution**:
    *   Implement backend logic to store n8n connection details.
    *   Allow users to trigger a specific (hardcoded for MVP) n8n webhook from the UI.
    *   Display simple success/failure UI feedback.
5.  **Agent Builder - Core Functionality**:
    *   Persistence of agent configurations (Supabase/SQLite).
    *   Dynamic Genkit flow that uses the agent's name, instructions, and selected model (from Ollama).
    *   Live test modal that calls this dynamic Genkit flow.

### Mid-Term
6.  **File/Document-based RAG**:
    *   File upload for Agent Knowledge.
    *   Vector store setup and embedding generation.
    *   Genkit flow updated for RAG.
7.  **Whiteboard MVP**:
    *   Integration of a drawing library (e.g., tldraw).
    *   Real-time sync (Liveblocks/Convex).
    *   Basic object layers and embeds.
8.  **MCP Browser & Secure Execution**:
    *   UI for MCP server configuration (in Settings).
    *   Dynamic tool discovery from configured MCP servers.
    *   Genkit tool for agents to securely call MCP tools.
9.  **Liveblocks Integration (Broader)**:
    *   If not already used for Whiteboards/Notes, integrate for presence indicators across the app.
    *   Multi-user state synchronization for relevant features.

### Long-Term
10. **Secure Audit Logging**: Comprehensive logging of user actions, agent invocations, and workflow executions.
11. **Cloud Fallback Agents**: Option to proxy or use cloud LLMs if local Ollama is unavailable or for specific tasks.
12. **Desktop Packaging**: PWA enhancements and Electron bundle for a native-like desktop experience with tray features.

---

## 7. Conclusion (Recap from Unified Guide)

LibreOllama offers an ambitious, privacy-first vision for personal and professional productivity—centered around customizable, local AI and seamless automations. By focusing development on its AI, agent, and automation core while enforcing best practices in security and UX, it can evolve into a powerful OS for thought and work. The next milestone should focus on transforming mocked components into robust, interoperable, and real-time-first modules.

