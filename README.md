# LibreOllama: The Privacy-First, ADHD-Optimized AI Workspace

<p align="center">
  <img src="https://raw.githubusercontent.com/mtmitchel/libreollama/main/src-tauri/icons/icon.png?raw=true" alt="LibreOllama Logo" width="128">
</p>

<h1 align="center">LibreOllama</h1>

<p align="center">
  <strong>Your private, local-first, all-in-one productivity suite, built for focus and clarity.</strong>
</p>

<p align="center">
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mtmitchel/libreollama/blob/main/LICENSE)
  [![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri-blueviolet)](https://tauri.app/)
  [![UI: React](https://img.shields.io/badge/UI-React-61DAFB)](https://reactjs.org/)
  [![Backend: Rust](https://img.shields.io/badge/Backend-Rust-dea584)](https://www.rust-lang.org/)
  [![ADHD-Optimized](https://img.shields.io/badge/ADHD-Optimized-brightgreen)](#)
</p>

---

**LibreOllama** is more than just a collection of tools; it's an integrated, privacy-first desktop application designed to be your single workspace for thinking, creating, and organizing. By harnessing the power of local AI through Ollama and a user experience crafted for neurodivergent minds, LibreOllama provides a calm, focused, and powerful environment to get work done without compromising your data.

Built with **Tauri**, **React**, and **Rust**, it's a cross-platform application that runs securely on your machine.

## Core Philosophy

* **Privacy First**: Your data is yours. Period. Everything is stored locally on your machine in an encrypted database. The application is designed to be fully functional offline. There is **zero telemetry** or data collection.
* **ADHD-Optimized UX**: We believe software should adapt to the user, not the other way around. Every feature is designed to reduce cognitive load, minimize distractions, and support executive function, without sacrificing power or professional capabilities.
* **Local AI Empowerment**: Unleash the power of large language models without sending your data to the cloud. LibreOllama integrates seamlessly with your local Ollama instance, giving you a powerful AI assistant that respects your privacy.
* **All-in-One Workspace**: Stop the context-switching. Chat, Projects, Tasks, Notes, and a professional-grade Canvas (Whiteboard) are all included in a single, cohesive interface.

## Features

LibreOllama provides a suite of deeply integrated tools designed to work together seamlessly.

| Feature          | Description                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard** | Your "command center." Get a clear overview of your day with widgets for active projects, today's focus, and agent statuses.                                            |
| **AI Chat** | A powerful, clean interface for interacting with your local LLMs. Supports conversation history, model switching, and more.                                               |
| **Projects** | A dedicated hub for each of your projects. Track progress, manage assets, and see a unified view of all related notes, tasks, and canvases.                              |
| **Notes** | A block-based editor for capturing ideas, structuring thoughts, and creating rich documents. Think Notion, but private and local.                                       |
| **Canvas** | A professional-grade, infinite whiteboard powered by **Konva.js**. Perfect for brainstorming, user flows, mind-mapping, and visual thinking. Features include **FigJam-style sections** for organizing content, **enhanced tables** with inline editing, 8-handle resize system, drag-and-drop functionality, and dynamic row/column management, sticky notes, shapes, advanced rich text editing with floating toolbar and selection detection, freehand drawing, connectors, and comprehensive transform controls. Includes hierarchical organization with automatic coordinate conversion and visual feedback systems. The canvas system is well-organized with 18 active components categorized into core canvas functionality, element types, UI components, and utilities. **Recent improvements**: Enhanced table resize functionality with custom blue dot handles for all 8 resize directions (corners and edges), optimized performance with proper ref usage, disabled conflicting Konva Transformer for tables, and comprehensive TypeScript error resolution. |
| **Tasks** | A visual Kanban board to manage your to-do lists. Drag and drop tasks between "To Do," "In Progress," and "Done."                                                        |
| **Calendar** | Plan your time and visualize your schedule. Designed to integrate with your tasks and project timelines.                                                                |
| **Agents** | The intelligence layer. Configure, manage, and monitor your local AI agents and models.                                                                                 |
| **Settings** | Granular control over the application, including theme, integrations, and model management.                                                                             |
| **Command Palette** | The power-user's best friend. Press `Ctrl+K` (`Cmd+K` on Mac) to instantly navigate anywhere, create new items, or perform actions.                                     |

## Tech Stack

LibreOllama is built on a modern, robust, and privacy-focused technology stack.

* **Framework**: [**Tauri**](https://tauri.app/) - A framework for building lightweight, secure, and cross-platform desktop applications using web technologies.
* **Frontend**: [**React**](https://reactjs.org/) & [**TypeScript**](https://www.typescriptlang.org/) - For a type-safe, component-based user interface.
* **Canvas**: [**Konva.js**](https://konvajs.org/) & [**React-Konva**](https://github.com/konvajs/react-konva) - High-performance 2D canvas library for professional whiteboard functionality.
* **Backend & Core Logic**: [**Rust**](https://www.rust-lang.org/) - Powers the secure, high-performance backend, managing everything from database connections to system-level commands.
* **Styling**: [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework for rapid, consistent styling, configured to use our internal design token system.
* **State Management**: [**Zustand**](https://zustand.surge.sh/) & React Context API - For simple, predictable state management with immer for immutable updates.
* **Database**: [**SQLCipher**](https://www.zetetic.net/sqlcipher/) (via `rusqlite`) - An encrypted SQLite database to keep all your data secure at rest.

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

The repository is organized to maintain a clear separation between the frontend and backend code.

```
libreollama/
├── docs/                      # Comprehensive project documentation
│   ├── development/           #   Developer setup and backend guides
│   ├── design-system/         #   UI/UX design documentation
│   └── archive/              #   Historical documentation and completed phases
├── src/                       # React Frontend
│   ├── components/            #   Shared UI components & page-specific components
│   │   └── canvas/            #     Professional whiteboard with 18 organized components
│   │       └── backup/        #       Legacy components for reference
│   ├── contexts/              #   React Context providers for global state
│   ├── hooks/                 #   Custom React hooks
│   ├── pages/                 #   Top-level page components for each module
│   ├── stores/                #   Zustand state management stores
│   ├── styles/                #   Organized CSS system with design tokens
│   │   └── README.md          #     Style organization and import hierarchy documentation
│   ├── lib/                   #   Utility functions and type definitions
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

## Documentation

LibreOllama includes comprehensive documentation to help you get started quickly and contribute effectively.

### **Quick Start Guides**
- **[Canvas Documentation](./docs/CANVAS_COMPLETE_DOCUMENTATION.md)** - Complete canvas documentation including user guide, architecture, and development information
- **[Styles Organization](./src/styles/README.md)** - CSS organization, import hierarchy, and design system documentation

### **Detailed Documentation**
- **[Documentation Index](./docs/README.md)** - Complete guide to all available documentation
- **[Development Setup](./docs/development/DEV-STARTUP-GUIDE.md)** - Environment setup and development workflow
- **[Canvas Complete Documentation](./docs/CANVAS_COMPLETE_DOCUMENTATION.md)** - Technical details of the Konva.js canvas system
- **[Canvas Tables Documentation](./docs/CANVAS_TABLES.md)** - Consolidated table functionality and implementation details
- **[UI Implementation](./docs/completed-phases/UI_IMPLEMENTATION_COMPLETE.md)** - Complete UI/UX design system and component documentation

### **Developer Resources**
- **[Rust Development Setup](./docs/development/RUST_DEVELOPMENT_SETUP.md)** - Backend development with Tauri
- **[Database Setup](./docs/development/DATABASE_SETUP.md)** - Local database configuration and management
- **[Design System](./docs/design-system/)** - UI components and design guidelines
## Contributing

We welcome contributions of all kinds! Whether you're fixing a bug, adding a new feature, or improving documentation, your help is appreciated.

Please read our **[Contributing Guidelines](./.github/CONTRIBUTING.md)** for a detailed overview of our development process and standards.

All contributors are expected to adhere to our **[Code of Conduct](./.github/CODE_OF_CONDUCT.md)**.

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.
