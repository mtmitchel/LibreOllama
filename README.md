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
| **Dashboard** | Your "command center." Get a clear overview of your day with widgets for active projects, today's focus, and agent statuses. *Widget framework implemented with limited data integration.*                                                                                                                                                                        |
| **AI Chat**   | A clean interface for AI conversations with conversation management UI. *Frontend UI complete but not connected to backend services or Ollama integration.*                                                                                                                                                         |
| **Projects**  | A project management interface with progress tracking and asset organization. *Complete UI framework implemented but operates on empty data with no backend functionality.*                                                                                                                                                           |
| **Notes**     | A rich text editor with block-based editing and folder organization. *Comprehensive Tiptap editor and complete backend services, but frontend-backend integration missing.*                                                                                                                                                 |
| **Canvas**    | A production-ready, infinite whiteboard for visual thinking. Features a robust, modular architecture and a full suite of tools for drawing, diagramming, and brainstorming. *Fully functional and exemplary implementation.*                                                                                                                                       |
| **Tasks**     | A visual Kanban board with Google Tasks integration. Drag and drop tasks between columns and sync with Google Tasks API. *Functional with good integration but has testing gaps.*                                                                                                                                                                |
| **Calendar**  | Plan your time and visualize your schedule with Google Calendar integration and task-to-event scheduling. *Feature-rich implementation with testing and reliability gaps.*                                                                                                                                                                                            |
| **Mail**      | Secure Gmail integration with multi-account support and comprehensive email management. *Robust implementation with strong testing coverage.*                                                                                                                                                                                                             |
| **Agents**    | Agent management interface. *Currently a placeholder implementation with no functional agent system.*                                                                                                                                                                                                             |
| **Settings**  | Comprehensive application configuration including theme, integrations, and preferences. *Complete UI with functional Google integration and settings persistence.*                                                                                                                                                                                                         |
| **Command Palette** | The power-user's best friend. Press `Ctrl+K` (`Cmd+K` on Mac) to instantly navigate anywhere, create new items, or perform actions. *Fully functional navigation system.*                                                                                                                                                             |

## Tech Stack

LibreOllama is built on a modern, robust, and privacy-focused technology stack with a well-structured architecture.

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

For comprehensive project documentation, see the **[Documentation Index](./docs/README.md)**.

### Key Documentation Files:
- **[Project Status](./docs/PROJECT_STATUS.md)** - Current implementation status and roadmap
- **[Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)** - Development patterns and best practices
- **[Technical Debt](./docs/TECHNICAL_DEBT.md)** - Known issues and improvement plans

## Testing & Development

LibreOllama includes comprehensive testing coverage with a focus on integration testing and real-world workflows.

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=canvas
npm test -- --testPathPattern=gmail

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. Check the [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md) for development patterns and best practices.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
