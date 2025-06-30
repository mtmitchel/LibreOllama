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

## 🎯 **CANVAS STATUS: PRODUCTION READY**

**Current Status (December 2024):**

The LibreOllama Canvas system is a **professional-grade FigJam-style whiteboard application** with complete drawing tools, advanced selection capabilities, and production-ready architecture.

**✅ PRODUCTION FEATURES:**
- **Complete Drawing Suite**: Marker, Highlighter, Washi Tape, Eraser tools
- **Advanced Selection**: Lasso selection with point-in-polygon algorithms
- **Shape Creation**: Full geometric primitive support with instant creation
- **Performance Optimized**: 60+ FPS with 1000+ elements, LOD rendering, viewport culling
- **Type-Safe Architecture**: Full TypeScript coverage with discriminated unions

**📋 COMPREHENSIVE DOCUMENTATION:**
All canvas development information is available in:

**[CANVAS_MASTER_DOCUMENTATION.md](docs/CANVAS_MASTER_DOCUMENTATION.md)** - Complete implementation guide and production roadmap

This documentation provides:
- Architecture overview and technical specifications
- Implementation status and feature completions
- Development roadmap and future enhancements
- Performance metrics and deployment guidelines

**🚀 ACTIVE DEVELOPMENT:**
- All core functionality implemented and stable
- Advanced features in active development
- Comprehensive testing coverage established
- Ready for production deployment

For complete documentation index, see [Documentation Directory](docs/README.md).

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
| **Canvas** | A **production-ready professional whiteboard** powered by **Konva.js** for visual thinking and diagramming. Complete drawing suite (Marker, Highlighter, Washi Tape, Eraser), advanced selection tools (Lasso), shape creation (Rectangle, Circle, Triangle, Star), text editing, and sections. Modern floating toolbar with 60+ FPS performance. Built on **React 19 + Zustand** with full TypeScript coverage and LOD rendering optimization. |
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

## Documentation & Guides

LibreOllama includes comprehensive documentation to help you get started quickly and contribute effectively.

### **Primary Documentation**
- **[Canvas Master Documentation](./docs/CANVAS_MASTER_DOCUMENTATION.md)** - **AUTHORITATIVE SOURCE** - Complete implementation guide, architecture validation, and production roadmap
- **[Documentation Index](./docs/README.md)** - Guide to all available project documentation

### **Development & Testing**
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - Development testing methodology and best practices
- **[Testing Demo](./docs/TESTING_DEMO.md)** - Step-by-step feature testing instructions
- **[Konva React Guides](./docs/KONVA_REACT_GUIDES/)** - Technical reference for canvas development

## 📚 Canvas Testing & Development

### Testing the Canvas

The LibreOllama Canvas includes comprehensive testing coverage:

```bash
# Run all tests
npm test

# Run specific canvas tests  
npm test -- --testPathPattern=canvas

# Run canvas feature validation
npm test -- canvas-rendering-validation.test.ts
```

### Canvas Test Suite

- **Store Testing**: Real store testing with `createUnifiedTestStore` pattern
- **Component Testing**: React component testing with proper store integration
- **Performance Testing**: Rendering validation and memory leak detection
- **Feature Testing**: Comprehensive tool and interaction validation

### Development Guidelines

- **Testing Philosophy**: Store-first testing with minimal mocking of external dependencies
- **Architecture**: Unified store pattern with TypeScript strict mode
- **Performance**: 60+ FPS target with intelligent throttling and LOD rendering
- **Documentation**: All changes documented in [Canvas Master Documentation](./docs/CANVAS_MASTER_DOCUMENTATION.md)


---

## Recent Updates

### 🏗️ **MAJOR CODEBASE REFACTORING COMPLETED** (June 26, 2025)

**✅ Enterprise-Grade Cleanup & Consolidation Complete**

LibreOllama has undergone a comprehensive **4-phase refactoring** to eliminate all code fragmentation, redundancy, and organizational issues identified in the codebase audit:

...existing code...
