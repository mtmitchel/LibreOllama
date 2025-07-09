**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

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

- **Gmail Integration:** A full suite of services for handling Gmail OAuth2 authentication, API interaction, and caching.
- **Tauri Commands:** Dozens of Tauri commands are implemented in `commands/` to expose backend functionality to the frontend in a secure way.
- **Database Operations:** A comprehensive set of database operations for managing application data.
- **Testing:** The backend has a good testing foundation, with `40 passing tests` that cover services and integration points.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Fix Failing Tests:** Resolve the `2 failing tests`. Based on previous reports, these are related to OAuth configuration and Gmail API scopes.
- [ ] **Clean Up Warnings:** Eliminate the `49 compiler warnings`. These are mostly unused imports and dead code that should be easy to clean up but are important for code hygiene.

### MVP Must-Haves

- [x] **SQLite Persistence:** Use SQLite for all modules to persist user data. *(Existing)*
- [x] **Tauri Command Interface:** A secure interface between frontend and backend. *(Existing)*
- [x] **Secure Token Storage:** Use the OS keyring for OAuth tokens. *(Existing)*

### Post-MVP Enhancements

- [ ] **Background Sync:** A system for background data sync for email and calendar.
- [ ] **WebSocket Support:** Add WebSocket support for future real-time features.
- [ ] **Chat API:** Design and create backend services and APIs for the Chat system.

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