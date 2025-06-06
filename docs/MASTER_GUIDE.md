# LibreOllama - Master Documentation Guide

*Consolidated documentation covering project overview, development setup, current state, and roadmap.*

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Phase & Status](#current-phase--status)
3. [Quick Reference](#quick-reference)
4. [Development Guide](#development-guide)
5. [Architecture Overview](#architecture-overview)
6. [Contributing](#contributing)

---

## Project Overview

LibreOllama is a sophisticated Tauri-based desktop application that provides a unified workspace for AI-powered productivity, knowledge management, and collaboration. The application integrates multiple AI models through Ollama with a comprehensive suite of productivity tools.

### Key Features

**🤖 AI Integration**
- Multiple AI model support through Ollama
- Intelligent chat interface with conversation management
- AI-powered task recommendations and insights
- Context-aware responses based on workspace data

**📝 Knowledge Management**
- Advanced note-taking with markdown support
- Knowledge graph visualization
- Semantic search across all content
- Tag-based organization and filtering

**✅ Task & Project Management**
- ADHD-optimized task interface
- Today's focus dashboard
- Energy level tracking
- Quick wins identification
- Pomodoro timer integration

**🎨 Visual Collaboration**
- Professional-grade canvas/whiteboard (Miro-style)
- Sticky notes, shapes, and drawing tools
- Infinite canvas with pan/zoom
- Real-time collaboration foundation

**🔗 Third-Party Integrations**
- Google Calendar, Tasks, and Gmail sync
- File system integration
- Database persistence with encryption

### Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Rust (Tauri framework)
- **Database**: SQLCipher (encrypted SQLite)
- **AI Integration**: Ollama API
- **Build System**: Vite + Tauri bundler

---

## Current Phase & Status

### Phase 6: Optimization & Polish (Current)
*Status: In Progress*

#### ✅ Recently Completed
- **Frontend Consolidation**: Streamlined component architecture, archived unused components
- **Canvas Redesign**: Complete Miro/FigJam-style whiteboard implementation
- **Dashboard Enhancement**: ADHD-optimized productivity dashboard
- **Search Integration**: Global search with typo tolerance
- **Google APIs**: Calendar, Tasks, Gmail integration
- **Database System**: SQLCipher implementation with full CRUD operations

#### 🔄 Current Focus
- **Performance Optimization**: Addressing CPU spikes and memory usage
- **UI/UX Polish**: Refining interactions and visual consistency
- **Documentation**: Consolidating and updating all documentation
- **Testing**: Comprehensive testing across all features
- **Accessibility**: ARIA compliance and keyboard navigation

#### 🎯 Next Priorities
- **Real-time Collaboration**: WebSocket integration for multi-user editing
- **Mobile Optimization**: Responsive design improvements
- **Plugin System**: Extensible architecture for third-party plugins
- **Advanced AI Features**: Context-aware assistance and automation

### Development Milestones

**Completed Phases:**
- ✅ Phase 1: Foundation & Design System
- ✅ Phase 2: Core Features Implementation  
- ✅ Phase 3: Advanced Features & Integrations
- ✅ Phase 4: Unified Workspace & Cleanup
- ✅ Phase 5: Google APIs & External Integrations

**Current Phase:**
- 🔄 Phase 6: Optimization & Polish

---

## Quick Reference

### Development Commands

```powershell
# Start development server
cd tauri-app
npm run dev
# Access at: http://localhost:1420

# Build for production
npm run build

# Run Tauri desktop app
npm run tauri dev

# Database operations
cargo run --bin db-setup
```

### Project Structure

```
LibreOllama/
├── src/                     # React frontend source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and integrations
│   └── pages/             # Page components
├── src-tauri/             # Rust backend source
│   ├── src/              # Rust source code
│   ├── capabilities/     # Tauri capabilities
│   └── icons/            # Application icons
├── docs/                  # Documentation (this file)
└── Design System/         # Figma design assets
```

### Key Components

- **App.tsx**: Main application entry point
- **UnifiedWorkspace**: Primary workspace interface
- **MainDashboardView**: ADHD-optimized dashboard
- **CanvasWhiteboard**: Miro-style collaborative canvas
- **GlobalSearchInterface**: Enhanced search functionality
- **GoogleAPIManager**: Third-party integrations

### Configuration Files

- **tauri.conf.json**: Tauri application configuration
- **vite.config.ts**: Frontend build configuration
- **tailwind.config.js**: Styling configuration
- **tsconfig.json**: TypeScript configuration

---

## Development Guide

### Prerequisites

**Required Software:**
- Node.js 18+ and npm
- Rust toolchain (latest stable)
- Git for version control

**Development Setup:**
```powershell
# Clone repository
git clone <repository-url>
cd LibreOllama

# Install frontend dependencies
npm install

# Verify Rust installation
rustc --version
cargo --version

# Test compilation
cd src-tauri
cargo check
```

### Environment Configuration

**Rust PATH Setup (Windows PowerShell):**
```powershell
# Temporary (current session)
$env:PATH += ";C:\Users\$env:USERNAME\.cargo\bin"

# Permanent
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Users\$env:USERNAME\.cargo\bin", "User")
```

### Development Workflow

1. **Start Development Server**
   ```powershell
   npm run dev
   ```
   - Frontend runs on `http://localhost:1420`
   - Hot reload enabled for rapid development

2. **Database Setup**
   ```powershell
   cd src-tauri
   cargo run --bin db-setup
   ```

3. **Run Tests**
   ```powershell
   # Frontend tests
   npm test
   
   # Backend tests
   cd src-tauri
   cargo test
   ```

### Code Style & Standards

- **TypeScript**: Strict mode enabled, full type safety
- **React**: Functional components with hooks
- **Rust**: Standard formatting with `cargo fmt`
- **Commits**: Conventional commit format
- **Capitalization**: Sentence case for all UI text

---

## Architecture Overview

### Frontend Architecture

**React Component Hierarchy:**
```
App.tsx
└── UnifiedWorkspace
    ├── ContextAwareTopBar (with GlobalSearch)
    ├── MainDashboardView
    │   ├── TodaysFocusDashboard
    │   └── ActivityAggregationHub
    ├── ChatInterface
    ├── NotesManager
    ├── TasksInterface
    └── CanvasWhiteboard
```

**State Management:**
- React hooks for local state
- Context providers for global state
- Custom hooks for complex logic
- Persistent storage via Tauri APIs

### Backend Architecture

**Rust Module Structure:**
```
src-tauri/src/
├── main.rs              # Application entry point
├── database/            # SQLCipher database layer
├── ai/                  # Ollama integration
├── google_apis/         # Google services integration
├── file_system/         # File operations
└── utils/               # Shared utilities
```

**Key Systems:**
- **Database Layer**: Encrypted SQLite with migrations
- **AI Integration**: Async Ollama API client
- **File System**: Secure file operations with sandboxing
- **IPC Layer**: Type-safe communication between frontend/backend

---

## Contributing

### Development Guidelines

1. **Follow TypeScript/Rust best practices**
2. **Write comprehensive tests for new features**
3. **Update documentation for API changes**
4. **Use conventional commit messages**
5. **Ensure accessibility compliance**

### Testing Requirements

- Unit tests for all utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for optimization

### Documentation Standards

- Update relevant documentation with code changes
- Include code examples for new APIs
- Maintain up-to-date setup instructions
- Document breaking changes in CHANGELOG

---

*This guide consolidates multiple documentation files. For specific setup issues, see [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md). For feature-specific documentation, see [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md).*
