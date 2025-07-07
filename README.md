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

**LibreOllama** is more than just a collection of tools; it's an integrated, desktop application designed to be your single workspace for thinking, creating, and organizing. By harnessing the power of local AI through Ollama and a user experience crafted for neurodivergent minds, LibreOllama provides a calm, focused, and powerful environment to get work done without compromising your data.

Built with **Tauri**, **React**, and **Rust**, it's a cross-platform application that runs securely on your machine.

## Core Philosophy

*   **AI-Powered Productivity**: Leveraging AI to enhance your workflow and creativity.
*   **Extensible Integrations**: Future integration with Google Calendar & Tasks APIs and upcoming support for various LLM APIs (e.g., OpenAI, Anthropic).
*   **All-in-One Workspace**: Chat, Projects, Tasks, Notes, and a professional-grade Canvas in a single, cohesive interface.

## Features

LibreOllama provides a suite of deeply integrated tools designed to work together seamlessly.

| Feature     | Description                                                                                                                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard** | Your "command center." Get a clear overview of your day with widgets for active projects, today's focus, and agent statuses.                                                                                                                                                                        |
| **AI Chat**   | A powerful, clean interface for interacting with your local LLMs. Supports conversation history, model switching, and more.                                                                                                                                                                         |
| **Projects**  | A dedicated hub for each of your projects. Track progress, manage assets, and see a unified view of all related notes, tasks, and canvases.                                                                                                                                                           |
| **Notes**     | A block-based editor for capturing ideas, structuring thoughts, and creating rich documents. Think Notion, but private and local.                                                                                                                                                                 |
| **Canvas**    | A production-ready, infinite whiteboard for visual thinking. Features a robust, modular architecture and a full suite of tools for drawing, diagramming, and brainstorming. For a deep dive into its architecture and functionality, see the **[Canvas Master Documentation](./docs/CANVAS_MASTER_DOCUMENTATION.md)**. |
| **Tasks**     | A visual Kanban board to manage your to-do lists. Drag and drop tasks between "To Do," "In Progress," and "Done."                                                                                                                                                                                |
| **Calendar**  | Plan your time and visualize your schedule. Designed to integrate with your tasks and project timelines.                                                                                                                                                                                            |
| **Agents**    | The intelligence layer. Configure, manage, and monitor your local AI agents and models.                                                                                                                                                                                                             |
| **Settings**  | Granular control over the application, including theme, integrations, and model management.                                                                                                                                                                                                         |
| **Command Palette** | The power-user's best friend. Press `Ctrl+K` (`Cmd+K` on Mac) to instantly navigate anywhere, create new items, or perform actions.                                                                                                                                                             |

## Tech Stack

LibreOllama is built on a modern, robust, and privacy-focused technology stack with a consolidated, enterprise-grade architecture.

*   **Framework**: [**Tauri**](https://tauri.app/) - A framework for building lightweight, secure, and cross-platform desktop applications using web technologies.
*   **Frontend**: [**React 19**](https://reactjs.org/) & [**TypeScript**](https://www.typescriptlang.org/) - For a type-safe, component-based user interface with full React 19 compatibility and concurrent features.
*   **Canvas**: [**Konva.js**](https://konvajs.org/) & [**React-Konva**](https://github.com/konvajs/react-konva) - High-performance 2D canvas library for professional whiteboard functionality, optimized for React 19's strict rendering requirements.
*   **Backend & Core Logic**: [**Rust**](https://www.rust-lang.org/) - Powers the secure, high-performance backend, managing everything from database connections to system-level commands.
*   **Styling**: [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   **State Management**: [**Zustand**](https://zustand.surge.sh/) - For simple, predictable global state management.
*   **Database**: [**SQLCipher**](https://www.zetetic.net/sqlcipher/) (via `rusqlite`) - An encrypted SQLite database to keep all your data secure at rest.

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
    git clone https://github.com/mtmitchel/libreollama.git
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
    Your LibreOllama desktop application will launch, and any changes you make to the Rust or React code will trigger a rebuild and refresh.

## Project Structure

The repository is organized with a clean, feature-based architecture. A detailed breakdown can be found in the comments within the file tree below.

```
libreollama/
├── docs/                      # Comprehensive project documentation
├── src/                       # React Frontend Source
│   ├── app/                   # Core application setup, routing, and main pages
│   ├── components/            # Global, shared UI components (layout, navigation)
│   ├── core/                  # Core framework logic (non-UI)
│   ├── features/              # Feature-based modules (e.g., Canvas, Chat)
│   └── tests/                 # Global tests and configuration
├── src-tauri/                 # Rust Backend (Tauri Core)
│   ├── src/                   # Rust source code
│   └── tauri.conf.json        # Core Tauri application configuration
└── README.md                  # This file
```

## Documentation

The single source of truth for all canvas-related architecture, development practices, and testing philosophy is the **[Canvas Master Documentation](./docs/CANVAS_MASTER_DOCUMENTATION.md)**.

### Gmail Integration

LibreOllama includes secure Gmail integration with comprehensive security features:

- **[Gmail Security Audit](./docs/GMAIL_SECURITY_AUDIT.md)** - Detailed security vulnerability analysis and fixes
- **[Gmail Code Review Summary](./docs/GMAIL_CODE_REVIEW_SUMMARY.md)** - Executive summary of security improvements
- **[Gmail Secure Setup Guide](./docs/GMAIL_SECURE_SETUP.md)** - Complete setup instructions for secure Gmail integration

For a guide to all other project documentation, see the **[Documentation Index](./docs/README.md)**.

## 📚 Canvas Testing & Development

The LibreOllama Canvas includes comprehensive testing coverage. See the master documentation for our testing philosophy.

```bash
# Run all tests
npm test

# Run specific canvas tests
npm test -- --testPathPattern=canvas
```

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
