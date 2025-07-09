**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Agents Roadmap

This document provides a comprehensive overview of the Agents feature, including its current (placeholder) implementation details and future development plans.

## Current Implementation (Placeholder)

The Agents page is currently a placeholder with a minimal UI and a skeletal backend implementation. The core concept of what an "Agent" is needs to be fully defined.

### Frontend Architecture

- **UI Components:** A basic `Agents.tsx` page component exists. There do not appear to be any other specific components for agent configuration or display.
- **State Management:** There is no dedicated store for agents.

### Backend Architecture

- **Placeholder Services:** The backend has a directory for agent services (`src-tauri/src/services/agents/`) and commands (`src-tauri/src/commands/agents/`), but these are likely placeholders without significant logic. `lifecycle.rs` suggests a concept of running and stopping agents.

### Implemented Features

- A basic UI shell for the Agents page.
- Placeholder backend files.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### High Priority / Core Functionality

- [ ] **Define "Agent" Concept:** This is the most critical first step. We need to clearly define what an "Agent" is. Is it an automated workflow, a connection to an external AI model, or a background task runner?

### MVP Must-Haves

- [ ] **Define & Execute Workflows:** A system to define and run simple, single-user automated workflows.
- [ ] **Agent Lifecycle Backend:** Backend commands for creating, starting, and stopping an agent.
- [ ] **Agent List UI:** A UI to list all available, configured agents.

### Post-MVP Enhancements

- [ ] **Event-Based Triggers:** Allow agents to be triggered by application events (e.g., "on new email from sender X...").
- [ ] **Agent Library:** A library of pre-built agents for common tasks that users can easily add and configure.

### Future Vision & "Wow" Delighters

- [ ] **No-Code Visual Builder:** A drag-and-drop interface for building agent workflows.
- [ ] **AI-Suggested Automations:** Proactively suggest useful automations to the user.
- [ ] **Personal Agent Templates:** Pre-built templates for personal productivity (e.g., "summarize my morning emails").

### UX/UI Improvements

- [ ] **Configuration Interface:** Design an intuitive, user-friendly interface for configuring complex agent parameters without writing code.
- [ ] **Status Visualization:** Create clear visualizations for agent status (e.g., running, idle, error).

### Technical Debt & Refactoring

- [ ] **Backend Implementation:** Once the concept is defined, build the core backend services (DB schema, Rust services, lifecycle management).
- [ ] **Frontend Integration:**
    - [ ] Create a dedicated Zustand store (`agentStore.ts`).
    - [ ] Connect the UI components to the backend services via Tauri commands.
- [ ] **Test Coverage:** Add comprehensive tests for the entire agent lifecycle.
- [ ] **Scalability:** Ensure the agent service is reliable and can scale to handle many agents running concurrently.
- [ ] **Documentation:** Document the agent architecture and API. 