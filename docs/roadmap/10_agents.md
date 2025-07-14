**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Agents Roadmap

This document provides a comprehensive overview of the Agents feature, including its current (placeholder) implementation details and future development plans.

## Current Implementation

The Agents page is currently a minimal placeholder implementation with no functional agent system. The core concept and functionality remain undefined and unimplemented.

### Frontend Architecture

- **UI Components:** A basic `Agents.tsx` page component exists with minimal placeholder content.
- **State Management:** No dedicated store for agents or agent management.
- **No Functional UI:** The page displays placeholder content without actual agent configuration or management capabilities.

### Backend Architecture

- **Placeholder Services:** The backend has directories for agent services (`src-tauri/src/services/agents/`) and commands (`src-tauri/src/commands/agents/`), but these contain minimal or no functional implementation.
- **Database Schema:** No established database schema for agent storage or management.
- **No API Endpoints:** No functional Tauri commands for agent operations.

### Current Implementation Status

- **Concept Undefined:** The fundamental concept of what an "Agent" represents in this system is not defined.
- **No Functionality:** No agent creation, management, execution, or monitoring capabilities exist.
- **Placeholder Only:** Both frontend and backend contain only placeholder structures without implementation.

### Implementation Gaps

- **Agent Definition:** No clear specification of what agents are or how they function.
- **UI Framework:** No interface for agent configuration, monitoring, or interaction.
- **Backend Services:** No backend logic for agent lifecycle management or execution.
- **Data Persistence:** No database schema or storage mechanisms for agent data.
- **Integration Points:** No connections to other system components or external services.

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