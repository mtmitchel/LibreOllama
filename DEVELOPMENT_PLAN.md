# LibreOllama Development Plan

## 1. Immediate Priorities (MVP Focus)

### 1.1. Functional Ollama-based Chat
- Integrate Genkit flow for chat using the selected Ollama model.
- Implement streaming responses in the chat UI.
- Persist chat sessions and messages using Supabase or SQLite.
- Error handling for Ollama connection issues.

### 1.2. Collaborative Note Editor
- Integrate BlockNote (or similar rich text editor) and Yjs for real-time collaboration.
- Persist notes (including editor state) in Supabase/SQLite.

### 1.3. Calendar & Kanban Tasks
- Backend persistence for calendar events and tasks.
- Refine drag-and-drop from Kanban to Calendar to create/update events.

### 1.4. n8n Webhook Execution
- Backend logic to store n8n connection details securely.
- Allow users to trigger a specific n8n webhook from the UI.
- Display simple success/failure feedback in the UI.

### 1.5. Agent Builder Core
- Persist agent configurations (Supabase/SQLite).
- Dynamic Genkit flow that uses agent’s name, instructions, and selected model.
- Live test modal that calls this dynamic Genkit flow.

---

## 2. Mid-Term Goals

### 2.1. File/Document-based RAG (Retrieval-Augmented Generation)
- Enable file upload for agent knowledge.
- Set up a vector store (e.g., Supabase pgvector, Pinecone).
- Implement embedding generation and update Genkit flows for RAG.

### 2.2. Whiteboard MVP
- Integrate a drawing library (e.g., tldraw).
- Real-time sync (Liveblocks/Convex).
- Basic object layers and embeds.

### 2.3. MCP Browser & Secure Execution
- UI for MCP server configuration (in Settings).
- Dynamic tool discovery from configured MCP servers.
- Genkit tool for agents to securely call MCP tools.

### 2.4. Liveblocks Integration
- Presence indicators and multi-user state sync for relevant features.

---

## 3. Technical Enhancements

### 3.1. Data Layer
- Choose and set up Supabase or SQLite as the primary database.
- Design schemas for users, notes, chat, agents, events, tasks, etc.
- Implement caching and encryption for sensitive data.

### 3.2. Security
- Sanitize user-generated content (DOMPurify).
- Implement strict CSP headers.
- Store API keys/tokens encrypted in the backend.
- Proxy all external API calls through backend routes.

### 3.3. Next.js Best Practices
- Refine modular structure by domain.
- Use Suspense and streaming for progressive UI hydration.
- Lazy-load heavy libraries.

---

## 4. UX & Accessibility

- Refine navigation and sidebar grouping.
- Progressive disclosure for complex forms (multi-step wizards).
- Consistent visual design and theme application.
- Accessibility: keyboard navigation, ARIA attributes, color contrast, skip links.

---

## 5. Development Roadmap (Suggested Order)

```mermaid
graph TD
    A[Functional Chat (Ollama+Genkit+Persistence)]
    B[Collaborative Notes (BlockNote+Yjs+Persistence)]
    C[Calendar & Kanban (Backend Integration)]
    D[n8n Webhook Execution]
    E[Agent Builder Core (Persistence+Dynamic Flow)]
    F[File-based RAG]
    G[Whiteboard MVP]
    H[MCP Integration]
    I[Liveblocks Presence]
    J[Security & Data Layer Enhancements]
    K[UX & Accessibility Refinements]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
```

---

## 6. Next Steps

1. Decide on Supabase vs. SQLite for persistence and set up the database.
2. Implement chat persistence and Ollama integration (Genkit flow, streaming, error handling).
3. Integrate BlockNote and Yjs for collaborative notes, with backend persistence.
4. Backend for calendar events and tasks; refine drag-and-drop.
5. n8n webhook backend and UI integration.
6. Agent builder persistence and dynamic Genkit flow.
7. Iterate on mid-term and technical enhancements as MVP stabilizes.