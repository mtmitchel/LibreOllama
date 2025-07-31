**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Agents Roadmap

This document provides a comprehensive overview of the Agents feature, including its current (placeholder) implementation details and future development plans.

## Current Implementation

The Agents page is currently a minimal placeholder implementation with no functional agent system. The core concept and functionality remain undefined and unimplemented.

### Frontend Architecture

- **UI Components:** The `Agents.tsx` page component provides agent management interface with:
  - Agent listing grid with status indicators
  - Agent creation modal with configuration options
  - Agent cards showing name, description, status, and capabilities
  - Delete functionality for agent removal
- **State Management:** Local state management within the page component
- **Mock Data:** Currently uses mock data for display

### Backend Architecture

- **Complete Backend Implementation:** Full agent services in `src-tauri/src/commands/agents/lifecycle.rs`
- **Tauri Commands:** Complete agent lifecycle management:
  - `create_agent` - Create new agents with configuration
  - `get_agents` - Retrieve all agents
  - `get_agent` - Get specific agent details
  - `update_agent` - Update agent configuration
  - `delete_agent` - Remove agents
  - `execute_agent` - Execute agent with input
  - `get_agent_executions` - Get execution history
- **Database Schema:** Full schema for agents and executions with proper models
- **Data Persistence:** SQLite storage for agents and their execution history

### Current Implementation Status

- ✅ **Backend Complete:** Full agent lifecycle management with database persistence
- ✅ **Agent Definition:** Agents are AI-powered assistants with:
  - Name, description, and system prompt configuration
  - Model selection (LLM provider)
  - Tool selection capabilities
  - Execution tracking and history
- ✅ **UI Framework:** Complete agent management interface with CRUD operations
- ❌ **Frontend-Backend Disconnection:** Frontend uses mock data instead of backend services
- ❌ **No LLM Integration:** Agent execution backend exists but no actual LLM connection

### Implementation Gaps

- **Frontend Integration:** Frontend needs to be connected to backend services
- **LLM Connection:** Agent execution needs to be connected to LLM providers
- **Tool Integration:** Agent tools need to be implemented and connected
- **Store Implementation:** Need dedicated `agentStore.ts` for state management
- **Real-time Updates:** No real-time status updates for running agents

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### High Priority / Core Functionality

- [x] **Define "Agent" Concept:** Agents are AI-powered assistants with configurable prompts, models, and tools. *(Completed)*

### MVP Must-Haves

- [x] **Agent Lifecycle Backend:** Backend commands for creating, starting, and stopping agents. *(Completed)*
- [x] **Agent List UI:** UI to list all available, configured agents. *(Completed)*
- [x] **Agent Creation Form:** Agent creation modal with configuration options. *(Completed)*
- [ ] **Frontend Integration:** Connect frontend to backend services.
- [ ] **LLM Integration:** Connect agent execution to actual LLM providers.
- [ ] **Execute Workflows:** Enable agents to actually process inputs and return outputs.

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