**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Backend Services Roadmap

This document provides a comprehensive overview of the backend architecture, including its current implementation details and future development plans.

## Design Assets

- This is a non-visual, architectural component. No specific design assets apply.

## Current Implementation

The backend follows a professional, service-oriented architecture with a clear separation of domains.

### Core Architecture

- **Language:** The entire backend is written in **Rust** for performance and safety.
- **Framework:** It's built as a **Tauri** backend, which allows it to be called securely from the JavaScript frontend.
- **Service-Oriented Design:** The code is organized by domain into services (e.g., `services/gmail`, `services/agents`). Each service encapsulates its own logic and data access.
- **Database:** The project uses **SQLite** for its database, managed by the `database/connection.rs` and `database/operations` modules. This provides a lightweight, file-based database solution.
- **Error Handling:** There is a centralized error handling system (`errors/mod.rs`) to ensure consistent error responses across the application.

### Key Implemented Features

**Core Services:**
- ✅ **Gmail Integration:** Full suite of services for OAuth2 authentication, API interaction, caching, and email operations
- ✅ **Google Calendar Integration:** Calendar API commands for event management and synchronization
- ✅ **Google Tasks Integration:** Tasks API with full CRUD operations and metadata support
- ✅ **Chat System:** Complete backend with session management, message persistence, and LLM integration
- ✅ **Notes System:** Full CRUD operations for notes and folders with hierarchical organization
- ✅ **Projects System:** Project management with backend persistence
- ✅ **Canvas Persistence:** Canvas state saving/loading functionality
- ✅ **LLM Integration:** Support for multiple LLM providers (OpenAI, Anthropic, Ollama, etc.)
- ✅ **Agent System:** Agent lifecycle management and execution

**Infrastructure:**
- ✅ **Tauri Commands:** Extensive command interface with domain-grouped organization
- ✅ **Database Operations:** Comprehensive SQLite operations across all domains
- ✅ **Rate Limiting:** Built-in rate limiting for API calls
- ✅ **Error Handling:** Centralized error system with consistent responses
- ✅ **Text Processing:** Advanced text processing utilities
- ✅ **Health Monitoring:** System health check endpoints

**Security & Storage:**
- ✅ **OAuth Token Management:** Secure token storage in OS keyring
- ✅ **Database Encryption:** SQLite with encryption support
- ✅ **Multi-Account Support:** Architecture supports multiple Google accounts

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Fix Failing Tests:** Resolve failing tests related to OAuth environment configuration and Gmail scopes configuration
- [ ] **Clean Up Warnings:** Eliminate compiler warnings (mostly unused imports and dead code)
- [ ] **Environment Configuration:** Document and finalize required environment variables for OAuth and API integrations

### MVP Must-Haves

- [x] **SQLite Persistence:** Use SQLite for all modules to persist user data. *(Existing)*
- [x] **Tauri Command Interface:** A secure interface between frontend and backend. *(Existing)*
- [x] **Secure Token Storage:** Use the OS keyring for OAuth tokens. *(Existing)*
- [x] **Chat Backend Services:** Complete backend implementation for chat functionality. *(Existing)*

### Code-Level Cleanup & Feature Completion
- [ ] **Implement Async Database Connections:** Refactor database operations in `agent_operations.rs`, `template_operations.rs`, and `performance_operations.rs` to use a proper async connection pool instead of placeholder sync connections.
- [ ] **Implement Secure Key Management:** Replace the placeholder key management in `database/connection.rs` with a secure production-ready solution.
- [ ] **Implement Attachment Extraction:** Add the logic to properly extract and process email attachments in `api_service.rs`.

### Post-MVP Enhancements

- [ ] **Background Sync:** A system for background data sync for email and calendar.
- [ ] **WebSocket Support:** Add WebSocket support for future real-time features.
- [ ] **Projects Backend:** Create backend services and APIs for the Projects system.
- [ ] **Notes Backend:** Create backend services and APIs for the Notes system.
- [ ] **Advanced Text Processing & AI Quality:**
    - [ ] Implement self-critique validation loops where the LLM evaluates its own response for accuracy and formatting before finalizing.
    - [ ] Add a multi-response ranking system to generate several answers and automatically select the highest-quality one.
    - [ ] Integrate advanced text normalization libraries (`unicode-normalization`, `unaccent`) for more robust text cleaning.

### Future Vision & "Wow" Delighters

- [ ] **Local AI Orchestration:** Use the backend to orchestrate heavy, local-AI agent tasks.
- [ ] **Background Model Updates:** A service to download/update AI models in the background.
- [ ] **Plugin Architecture:** Design a system for future third-party service integrations.

### Security

- [ ] **Security Audit:** Conduct a full security audit of all backend services, especially those handling sensitive data.
- [ ] **End-to-End Encryption:** For features that require it (like Chat or Notes), implement end-to-end encryption.
- [ ] **Input Validation:** Strengthen validation and sanitization on all data received from the frontend.

### Technical Debt & Refactoring

- [ ] **Database Schema:** Improve the database schema by adding proper indexing to tables to ensure queries remain fast.
- [ ] **Error Handling:** Refactor the error handling system to be more consistent and provide more informative messages.
- [ ] **Unified Logging:** Create a unified logging strategy across all services to make debugging and monitoring easier.
- [ ] **Robust Caching:** Implement a more robust, application-wide caching layer for all major API endpoints. 