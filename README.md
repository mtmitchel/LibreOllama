# LibreOllama: The AI-Powered All-in-One Productivity Suite

<p align="center">
  <img src="https://raw.githubusercontent.com/mtmitchel/libreollama/main/src-tauri/icons/icon.png?raw=true" alt="LibreOllama Logo" width="128">
</p>

<h1 align="center">LibreOllama</h1>

<p align="center">
  <strong>Your integrated AI-powered workspace for thinking, creating, and organizing.</strong>
</p>

<p align="center">
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mtmitchel/libreollama/blob/main/LICENSE)
  [![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-blueviolet)](https://tauri.app/)
  [![UI: React 19](https://img.shields.io/badge/UI-React%2019-61DAFB)](https://reactjs.org/)
  [![Backend: Rust](https://img.shields.io/badge/Backend-Rust-dea584)](https://www.rust-lang.org/)
  [![React 19 Compatible](https://img.shields.io/badge/React%2019-Compatible-brightgreen)](https://reactjs.org/blog/2024/04/25/react-19)
</p>

---

## 🚨 **CANVAS STATUS: CRITICAL ARCHITECTURAL CONFLICTS IDENTIFIED**

**Current Status (June 28, 2025):**

The LibreOllama Canvas system is experiencing severe architectural instability requiring immediate expert-level rectification. The codebase contains critical conflicts that prevent reliable functionality.

**⚠️ SYSTEM INSTABILITY WARNING:**
- **High-Risk Architecture**: Multiple conflicting implementations creating unpredictable behavior
- **Critical Defects**: Elements snap back, tools non-functional, position sync failures
- **Technical Debt**: Legacy code conflicts with active implementations
- **Expert Surgery Required**: Systematic architectural cleanup needed

**📋 AUTHORITATIVE RECOVERY PLAN:**
All canvas development MUST follow the comprehensive recovery plan outlined in:

**[REFACTOR FINAL PLAN](docs/REFACTOR%20FINAL%20PLAN.md)** - The single source of truth for system rectification

This plan provides:
- 4-phase systematic recovery process
- Complete architectural conflict resolution
- Code consolidation and cleanup procedures
- Target architecture specification

**🚨 DEVELOPMENT MORATORIUM:**
- No new feature development until architectural conflicts are resolved
- All work must align with the REFACTOR FINAL PLAN
- System requires expert-level architectural surgery before stability

For archived technical documentation, see [Documentation Index](docs/README.md).

---

**LibreOllama** is more than just a collection of tools; it's an integrated, desktop application designed to be your single workspace for thinking, creating, and organizing. By harnessing the power of local AI through Ollama and a user experience crafted for neurodivergent minds, LibreOllama provides a calm, focused, and powerful environment to get work done without compromising your data.

Built with **Tauri**, **React**, and **Rust**, it's a cross-platform application that runs securely on your machine.

## Core Philosophy

* **AI-Powered Productivity**: Leveraging AI to enhance your workflow and creativity.
* **Extensible Integrations**: Future integration with Google Calendar & Tasks APIs and upcoming support for various LLM APIs (e.g., OpenAI, Anthropic).
* **All-in-One Workspace**: Chat, Projects, Tasks, Notes, and a professional-grade Canvas in a single, cohesive interface.

## Features

LibreOllama provides a suite of deeply integrated tools designed to work together seamlessly.

| Feature          | Description                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard** | Your "command center." Get a clear overview of your day with widgets for active projects, today's focus, and agent statuses.                                            |
| **AI Chat** | A powerful, clean interface for interacting with your local LLMs. Supports conversation history, model switching, and more.                                               |
| **Projects** | A dedicated hub for each of your projects. Track progress, manage assets, and see a unified view of all related notes, tasks, and canvases.                              |
| **Notes** | A block-based editor for capturing ideas, structuring thoughts, and creating rich documents. Think Notion, but private and local.                                       |
| **Canvas** | A professional infinite whiteboard powered by **Konva.js** for visual thinking and diagramming. Core architecture complete with unified store pattern. Basic tools working (text, rectangles, circles), advanced tools in development (sections, connectors, pen tools, image upload). Modern floating toolbar with tool selection. Built on **React 19 + Zustand** with TypeScript for type safety and performance. |
| **Tasks** | A visual Kanban board to manage your to-do lists. Drag and drop tasks between "To Do," "In Progress," and "Done."                                                        |
| **Calendar** | Plan your time and visualize your schedule. Designed to integrate with your tasks and project timelines.                                                                |
| **Agents** | The intelligence layer. Configure, manage, and monitor your local AI agents and models.                                                                                 |
| **Settings** | Granular control over the application, including theme, integrations, and model management.                                                                             |
| **Command Palette** | The power-user's best friend. Press `Ctrl+K` (`Cmd+K` on Mac) to instantly navigate anywhere, create new items, or perform actions.                                     |

## Tech Stack

LibreOllama is built on a modern, robust, and privacy-focused technology stack with a **consolidated, enterprise-grade architecture**.

* **Framework**: [**Tauri**](https://tauri.app/) - A framework for building lightweight, secure, and cross-platform desktop applications using web technologies.
* **Frontend**: [**React 19**](https://reactjs.org/) & [**TypeScript**](https://www.typescriptlang.org/) - For a type-safe, component-based user interface with full React 19 compatibility and concurrent features.
* **Canvas**: [**Konva.js**](https://konvajs.org/) & [**React-Konva**](https://github.com/konvajs/react-konva) - High-performance 2D canvas library for professional whiteboard functionality, optimized for React 19's strict rendering requirements.
* **Backend & Core Logic**: [**Rust**](https://www.rust-lang.org/) - Powers the secure, high-performance backend, managing everything from database connections to system-level commands.
* **Styling**: [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework with **consolidated design system** in single `globals.css` file, eliminating style fragmentation and import conflicts.
* **State Management**: [**Zustand**](https://zustand.surge.sh/) & React Context API - For simple, predictable state management with React 19 compatible selector patterns, immutable updates, and **memory-optimized viewport culling** with dynamic configuration.
* **Database**: [**SQLCipher**](https://www.zetetic.net/sqlcipher/) (via `rusqlite`) - An encrypted SQLite database to keep all your data secure at rest.
* **Architecture**: **Feature-based organization** with co-located components, tests, and utilities for optimal maintainability and developer experience.

## Getting Started: Development Setup

Ready to contribute? Follow these steps to get your development environment up and running.

### Prerequisites

1.  **Rust & Cargo**: Required for the Tauri backend. [Install via rustup](https://www.rust-lang.org/tools/install).
2.  **Node.js & npm**: Required for the React frontend. We recommend using `nvm` to manage Node versions.
3.  **Tauri CLI**: Install the command-line interface for Tauri development.
    ```bash
    cargo install tauri-cli
    ```
4.  **Ollama**: You'll need a local instance of [Ollama](https://ollama.com/) running to use the AI features.

### Installation & Launch

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/mtmitchel/libreollama.git](https://github.com/mtmitchel/libreollama.git)
    cd libreollama
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This command starts both the Rust backend and the React frontend in a single, hot-reloading development environment.
    ```bash
    npm run tauri:dev
    ```

    > **Note for Windows users**: The `tauri:dev` script in `package.json` is pre-configured to find your Cargo installation. If you encounter issues, ensure `~/.cargo/bin` is in your system's `PATH`.

Your LibreOllama desktop application will launch, and any changes you make to the Rust or React code will trigger a rebuild and refresh.

## Project Structure

The repository is organized with a clean, feature-based architecture following modern best practices after comprehensive refactoring (June 2025).

```
libreollama/
├── docs/                      # Comprehensive project documentation
│   ├── development/           #   Developer setup and backend guides
│   ├── design-system/         #   UI/UX design documentation
│   └── archive/              #   Historical documentation and completed phases
├── src/                       # React Frontend
│   ├── components/            #   Shared UI components & page-specific components
│   ├── features/              #   Feature-based organization
│   │   └── canvas/            #     Professional whiteboard system
│   │       ├── components/    #       Canvas UI components (18+ organized components)
│   │       ├── hooks/         #       Canvas-specific React hooks
│   │       ├── stores/        #       Canvas state management (Zustand)
│   │       ├── tests/         #       Co-located canvas tests (consolidated)
│   │       ├── types/         #       Canvas type definitions
│   │       └── utils/         #       Canvas utility functions
│   ├── contexts/              #   React Context providers for global state
│   ├── design-system/         #   Consolidated design system
│   │   └── globals.css        #     SINGLE consolidated stylesheet (all CSS merged)
│   ├── hooks/                 #   Shared React hooks
│   ├── lib/                   #   Shared utilities and services
│   │   └── logger.ts          #     UNIFIED logger (consolidated from 2 files)
│   ├── pages/                 #   Top-level page components for each module
│   ├── stores/                #   Global Zustand state management stores
│   ├── tests/                 #   Global test utilities and shared tests
│   │   ├── __mocks__/         #     Global mocks and test utilities
│   │   └── setup/             #     Test configuration and setup
│   └── main.tsx               #   Application entry point
├── src-tauri/                 # Rust Backend (Tauri Core)
│   ├── capabilities/          #   Tauri permission manifests
│   ├── src/                   #   Rust source code
│   │   ├── commands/          #     Tauri commands exposed to the frontend
│   │   ├── database/          #     All database logic (schema, models, operations)
│   │   └── lib.rs             #     Main Rust library, command registration
│   ├── build.rs               #   Tauri build script
│   └── tauri.conf.json        #   Core Tauri application configuration
├── archives/                  # Archived legacy code and documentation
├── tailwind.config.ts         # Tailwind CSS configuration file
└── README.md                  # This file
```

### 🏗️ **Architecture Highlights**

- **Feature-Colocated Organization**: Canvas system properly organized under `src/features/canvas/`
- **Consolidated Styles**: Single `globals.css` eliminates CSS fragmentation and import conflicts
- **Unified Utilities**: Single logger with comprehensive capabilities serves entire application
- **Clean Test Structure**: Tests organized by feature with shared utilities properly separated
- **Zero Redundancy**: No duplicate files or conflicting dependencies

## Documentation & Roadmap

LibreOllama includes comprehensive documentation to help you get started quickly and contribute effectively.

### **Quick Start Guides**
- **[Canvas Complete Guide](./docs/CANVAS_COMPLETE_GUIDE.md)** - Master document for Canvas features and usage

### **Detailed Documentation**
- **[Documentation Index](./docs/README.md)** - Guide to all available project documentation
- **[Development Setup](./docs/development/DEV-STARTUP-GUIDE.md)** - Environment setup and development workflow
- **[Canvas Development](./docs/development/CANVAS_DEVELOPMENT.md)** - In-depth Canvas technical guides
- **[UI Implementation](./docs/completed-phases/UI_IMPLEMENTATION_COMPLETE.md)** - UI/UX design system and component documentation

## 📚 Documentation & Testing

### Canvas Documentation

For comprehensive information about the LibreOllama Canvas system:

- 📋 [Canvas Development Roadmap](./docs/CANVAS_DEVELOPMENT_ROADMAP_REVISED.md) - **Single source of truth** for canvas implementation status, architecture details, and development progress
- 🧪 [Canvas Testing](./src/tests/) - Complete test suite including:
  - `canvas-text-editing.test.ts` - Text editing system validation
  - `canvas-sections-advanced-tests.ts` - Section functionality tests  
  - `phase1-test-suite.ts` - Architecture validation tests
  - `canvas-rendering-validation.ts` - Rendering performance tests
  - `table-cell-editing-refactor-test.ts` - Table editing tests

### Archived Documentation

Historical development documentation has been organized in `./archives/canvas-documentation/` including:
- Previous implementation plans and reports
- Completed phase summaries
- Migration guides and technical decisions

### Testing the Canvas

To run canvas tests:

```bash
# Run all tests
npm test

# Run specific canvas tests
npm test -- --testPathPattern=canvas

# For browser-based validation tests, open Canvas page and run:
# (Available in browser console)
window.runCanvasRenderingTests();
```

---

## Current Canvas System Status (December 28, 2024)

### **✅ PHASE 2B STORE ARCHITECTURE MIGRATION COMPLETED**

- **Store Migration**: Core components successfully migrated from adapter pattern to unified store architecture
- **Rendering Pipeline Fixed**: Resolved critical issue where canvas elements weren't visible in UI
- **Event Handling Centralized**: Unified event delegation through CanvasEventHandler component
- **Type Safety Improved**: Eliminated `as any` casts in core rendering components
- **Infrastructure Stability**: Fixed infinite loop issues and circular dependencies

### **Current Development Status**
- **Architecture**: Unified store pattern established as foundation
- **Components**: 13+ core components migrated and operational
- **Testing**: UI validation and feature testing in progress
- **Documentation**: Being updated to reflect current implementation
- **Next Phase**: UI/UX modernization and component standardization planned

## Canvas Documentation Quick Links
- [REFACTOR FINAL PLAN](./docs/REFACTOR%20FINAL%20PLAN.md) - **AUTHORITATIVE SOURCE** - Complete system rectification plan
- [Documentation Index](./docs/README.md) - Complete documentation directory and archived materials

## Recent Canvas Architecture Highlights (December 28, 2024)

### **Phase 2B Store Migration Achievements**
- **UI Rendering Pipeline Fixed**: Resolved critical issue where MainLayer received empty elements array
- **Event Handling Centralization**: Consolidated event logic through CanvasEventHandler component
- **Store Access Standardization**: Migrated components to use unified store with proper selectors
- **Type Safety Improvements**: Eliminated type casting in core rendering components
- **Infrastructure Stability**: Fixed infinite loop issues and circular dependency problems

### **Technical Foundation Established**
- **Unified Store Architecture**: Single source of truth for canvas state management
- **Component Migration Pattern**: Established clear migration path for remaining components
- **Error Resolution Framework**: Systematic approach to fixing architectural violations
- **Testing Foundation**: Framework for validating migrated components


---

## Recent Updates

### 🏗️ **MAJOR CODEBASE REFACTORING COMPLETED** (June 26, 2025)

**✅ Enterprise-Grade Cleanup & Consolidation Complete**

LibreOllama has undergone a comprehensive **4-phase refactoring** to eliminate all code fragmentation, redundancy, and organizational issues identified in the codebase audit:

...existing code...
