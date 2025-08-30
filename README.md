
# LibreOllama: AI-Powered Productivity Suite

<p align="center">
  <img src="https://raw.githubusercontent.com/mtmitchel/libreollama/main/src-tauri/icons/icon.png?raw=true" alt="LibreOllama Logo" width="128">
</p>

<p align="center">
  <strong>An open-source, locally-run, privacy-first workspace for thinking, creating, and organizing.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri-blueviolet" alt="Built with Tauri"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/UI-React%2019-61DAFB" alt="UI: React 19"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Backend-Rust-dea584" alt="Backend: Rust"></a>
</p>

---

LibreOllama is a cross-platform desktop application that brings together AI chat, a visual canvas, email management, task organization, and note-taking in a single, cohesive workspace. Built with Tauri, React 19, and Rust for security, performance, and reliability.

## ✨ Key Features

### 🎨 **Visual Canvas** (Production Ready)
Professional-grade infinite whiteboard with 15+ element types, smart connectors, and advanced drawing tools. Perfect for visual thinking, diagramming, and brainstorming.

### 💬 **AI Chat** (Production Ready)
Complete chat UI with multi-provider LLM integration (OpenAI, Anthropic, Ollama, etc.), conversation management, and real-time streaming responses.

### ✅ **Tasks Management** (Production Ready)
Full-featured Kanban board with drag-and-drop, local storage persistence, and rich metadata editing.

### 📧 **Gmail Integration** (Near Complete) 
Secure OAuth2-powered email client with full Gmail functionality: reading, composing, searching, labels, attachments, and multi-account support.

### 📝 **Rich Notes** (Production Ready)
Powerful note-taking with a BlockNote-based editor, hierarchical folder organization, rich text formatting, and seamless persistence.

### 📅 **Calendar Integration** (Functional)
Google Calendar integration with event display and task synchronization capabilities.

### 📁 **Projects** (In Progress)
Comprehensive project organization with task association, progress tracking, and asset management.

## 🛠️ Technology Stack

- **Framework**: [Tauri](https://tauri.app/) - Secure, lightweight desktop applications
- **Frontend**: [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) - Modern, type-safe UI
- **Canvas**: [Konva.js](https://konvajs.org/) + React-Konva - High-performance 2D graphics
- **Backend**: [Rust](https://www.rust-lang.org/) - Secure, fast system operations
- **Styling**: **Asana-Inspired Design System** - Migrating from Tailwind CSS to a custom, consistent design system.
- **State**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) - Simple, predictable state management
- **Database**: SQLite - Secure local data storage

## 🚀 Quick Start

### Prerequisites

1. **Rust & Cargo** - [Install via rustup](https://www.rust-lang.org/tools/install)
2. **Node.js & npm** - [Download from nodejs.org](https://nodejs.org/)
3. **Tauri CLI**:
   ```bash
   cargo install tauri-cli
   ```

### Installation

1. **Clone and setup**:
   ```bash
   git clone https://github.com/mtmitchel/libreollama.git
   cd libreollama
   npm install
   ```

2. **Start development**:
   ```bash
   # Run the full Tauri application (frontend + backend)
   npm run tauri:dev

   # Run the frontend only (Vite dev server)
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run tauri:build
   ```

## 📁 Project Structure

```
libreollama/
├── docs/                       # 📚 Complete documentation
│   ├── CANVAS_ARCHITECTURE_AUDIT_UPDATED.md
│   ├── PROJECT_STATUS.md
│   └── ...
├── src/                       # ⚛️ React frontend
│   ├── features/              # 🧩 Feature modules (canvas, mail, etc.)
│   ├── components/            # 🔧 Shared UI components
│   ├── stores/                # 🏪 Zustand state management
│   └── ...
├── src-tauri/                 # 🦀 Rust backend
│   ├── src/commands/          # 📡 API commands
│   └── src/services/          # 🔧 Business logic
└── ...
```

## 📊 Development Status

**Current Phase**: Phase 2 - Critical Feature Integration (85% Complete)

| Feature | Status | Completion |
|---|---|---|
| Canvas System | ✅ Production Ready | 100% |
| Chat System | ✅ Production Ready | 100% |
| Tasks Management | ✅ Production Ready | 100% |
| Notes System | ✅ Production Ready | 100% |
| Gmail Integration | ✅ Near Complete | 95% |
| Calendar Integration | 🟡 Functional | 90% |
| Projects Feature | 🟡 UI Complete | 50% |

## 🧪 Testing & Quality

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Code quality checks
npm run lint
npm run type-check
```

**Quality Standards:**
- Zero TypeScript errors policy
- 80%+ test coverage for implemented features
- WCAG AA accessibility compliance
- 60fps animation performance

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) directory, including:

- **`CANVAS_ARCHITECTURE_AUDIT_UPDATED.md`**: A deep dive into the canvas system's architecture.
- **`PROJECT_STATUS.md`**: A detailed breakdown of the status of every feature.
- **`DESIGN_SYSTEM.md`**: Guidelines for the Asana-inspired design system.

## 🤝 Contributing

We welcome contributions! Please review the documentation in the `docs/` folder to understand the project's architecture, design, and testing patterns.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
