# LibreOllama: AI-Powered Productivity Suite

<p align="center">
  <img src="https://raw.githubusercontent.com/mtmitchel/libreollama/main/src-tauri/icons/icon.png?raw=true" alt="LibreOllama Logo" width="128">
</p>

<p align="center">
  <strong>An integrated AI-powered workspace for thinking, creating, and organizing.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri-blueviolet" alt="Built with Tauri"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/UI-React%2019-61DAFB" alt="UI: React 19"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Backend-Rust-dea584" alt="Backend: Rust"></a>
</p>

---

LibreOllama is a cross-platform desktop application that brings together AI chat, visual canvas, email management, task organization, and note-taking in a single, cohesive workspace. Built with Tauri, React 19, and Rust for security, performance, and reliability.

## ✨ Key Features

### 🎨 **Visual Canvas** (Production Ready)
Professional-grade infinite whiteboard with 15+ element types, smart connectors, drawing tools, and real-time collaboration features. Perfect for visual thinking, diagramming, and brainstorming.

### 📧 **Gmail Integration** (Near Complete) 
Secure OAuth2-powered email client with full Gmail functionality: reading, composing, searching, labels, attachments, and multi-account support.

### 📝 **Rich Notes** (Complete)
Powerful note-taking with BlockNote editor, folder organization, rich text formatting, and seamless persistence.

### 📅 **Tasks & Calendar** (Functional)
Kanban board with Google Tasks integration, drag-and-drop functionality, and calendar time-blocking with Google Calendar sync.

### 🤖 **AI Chat** (Planned)
Multi-provider LLM integration supporting OpenAI, Anthropic, and local models with conversation management and file attachments.

### 📊 **Project Management** (Planned)
Comprehensive project organization with task association, progress tracking, and asset management.

## 🛠️ Technology Stack

- **Framework**: [Tauri](https://tauri.app/) - Secure, lightweight desktop applications
- **Frontend**: [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) - Modern, type-safe UI
- **Canvas**: [Konva.js](https://konvajs.org/) + React-Konva - High-performance 2D graphics
- **Backend**: [Rust](https://www.rust-lang.org/) - Secure, fast system operations
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling with design tokens
- **State**: [Zustand](https://zustand.surge.sh/) - Simple, predictable state management
- **Database**: SQLite with encryption - Secure local data storage

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
   npm run dev:tauri  # Full Tauri development (recommended)
   npm run dev        # Frontend only (if needed)
   ```

3. **Build for production**:
   ```bash
   npm run build:tauri
   ```

## 📁 Project Structure

```
libreollama/
├── docs/                       # 📚 Complete documentation
│   ├── PRODUCTION_READINESS.md # 🎯 Project roadmap & status
│   ├── DESIGN_SYSTEM.md        # 🎨 Design tokens & components
│   ├── ARCHITECTURE.md         # 🏗️ Technical implementation
│   ├── TESTING_STRATEGY.md     # 🧪 Testing approach
│   └── roadmap/               # 📋 Feature specifications
├── src/                       # ⚛️ React frontend
│   ├── features/              # 🧩 Feature modules (canvas, mail, etc.)
│   ├── components/            # 🔧 Shared UI components
│   ├── app/                   # 🏠 App shell & routing
│   └── core/                  # ⚙️ Core utilities & hooks
├── src-tauri/                 # 🦀 Rust backend
│   ├── src/commands/          # 📡 API commands
│   ├── src/services/          # 🔧 Business logic
│   └── src/database/          # 🗄️ Data persistence
└── scripts/                   # 🛠️ Build & development tools
```

## 📊 Development Status

**Current Phase**: Phase 2 - Critical Feature Integration (70% Complete)

| Feature | Status | Completion |
|---------|--------|------------|
| Canvas System | ✅ Complete | 100% |
| Gmail Integration | ✅ Near Complete | 95% |
| Notes System | ✅ Complete | 100% |
| Tasks Management | 🟡 Functional | 85% |
| Calendar Integration | 🟡 Functional | 90% |
| Navigation & UI | ✅ Complete | 95% |
| Chat System | 🔴 Planned | 0% |
| Projects Feature | 🔴 Planned | 0% |

## 🧪 Testing & Quality

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific features
npm test -- canvas
npm test -- gmail

# Watch mode for development
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

Complete documentation is available in the [`docs/`](./docs/) directory:

- **[Documentation Hub](./docs/README.md)** - Main documentation index
- **[Production Readiness](./docs/PRODUCTION_READINESS.md)** - Complete project roadmap
- **[Design System](./docs/DESIGN_SYSTEM.md)** - Colors, typography, components
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Technical implementation
- **[Testing Strategy](./docs/TESTING_STRATEGY.md)** - Testing approach & patterns

### For Developers
- **[Feature Roadmap](./docs/roadmap/)** - Detailed feature specifications

## 🤝 Contributing

We welcome contributions! Please:

1. Read the [Architecture Guide](./docs/ARCHITECTURE.md) for patterns and conventions
2. Follow the [Design System](./docs/DESIGN_SYSTEM.md) for UI consistency
3. Use the [Testing Strategy](./docs/TESTING_STRATEGY.md) for quality assurance
4. Check the [Production Readiness Plan](./docs/PRODUCTION_READINESS.md) for priorities

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Ready to get productive?** Start with `npm run tauri dev` and explore the integrated workspace designed for modern knowledge work.