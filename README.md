# 🧠 LibreOllama: ADHD-Optimized AI Productivity Platform

> **Privacy-First • Local AI • Professional Workspace**  
> Comprehensive productivity suite designed specifically for neurodivergent professionals, combining local LLMs, intelligent task management, professional whiteboard, and focus-optimized workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.5-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org/)
[![ADHD Optimized](https://img.shields.io/badge/ADHD-Optimized-green.svg)](#adhd-features)
[![Privacy First](https://img.shields.io/badge/Privacy-First-red.svg)](#privacy)

## 🎯 What is LibreOllama?

LibreOllama is a **comprehensive ADHD-optimized AI productivity platform** that transforms how neurodivergent professionals work with AI. Built as a secure Tauri desktop application, it integrates local Large Language Models with professional-grade productivity tools, creating a unified workspace that adapts to your cognitive patterns and energy levels.

**🧠 ADHD-First Design**: Every interface element reduces cognitive load, minimizes distractions, and supports executive function challenges while maintaining professional capabilities.

## 🔒 Core Principles

### **Privacy-First Architecture**
- **🏠 100% Local-First**: All data stays on your machine, zero cloud dependencies
- **🔐 Encrypted Storage**: SQLCipher database with secure local encryption
- **📡 Offline-Capable**: Works completely without internet connection
- **🚫 Zero Telemetry**: No tracking, analytics, or data collection
- **👁️ Full Transparency**: Open source with complete control over your data

### **ADHD-Optimized Design** {#adhd-features}
- **🧠 Cognitive Load Management**: Simplified interfaces that reduce mental overhead
- **⚡ Energy-Aware Workflows**: Task management that adapts to your energy levels
- **🎯 Focus Mode**: Distraction-free environments with typewriter scrolling
- **🏷️ Visual Organization**: Color-coded systems and clear information hierarchy
- **⌨️ Keyboard-First**: Command palette and shortcuts for efficient navigation
- **📱 Sensory Considerations**: Motion reduction and customizable density levels

## 🎨 **Professional Whiteboard Platform**

LibreOllama Desktop features a **Miro/FigJam-class digital canvas** with professional tools and interactions:

### **Professional Toolset**
- **🖱️ Select Tool**: Multi-element selection, drag-and-drop manipulation
- **📝 Sticky Notes**: Color-coded notes with rich text editing
- **📄 Text Blocks**: Formatted text with typography controls
- **✏️ Drawing Tools**: Freehand pen with pressure sensitivity
- **🔷 Shape Library**: Rectangles, circles, arrows, frames, and more
- **📏 Connectors**: Smart lines and arrows with auto-routing
- **🖼️ Media Support**: Image embedding and file attachments
- **🗑️ Advanced Editing**: Undo/redo, copy/paste, delete operations

### **Canvas Operations**
- **🔍 Zoom & Pan**: 25%-400% zoom with smooth navigation
- **📐 Grid System**: Alignment guides and snapping
- **🗺️ Minimap**: Overview navigation for large canvases
- **⌨️ Keyboard Shortcuts**: 20+ shortcuts for power users
- **📱 Touch Support**: Optimized for tablets and touch devices

### **Quality Assurance**
- **🧪 Comprehensive Testing**: Built-in test suite with 40+ test cases
- **📊 Performance Monitoring**: Real-time metrics and optimization
- **♿ Accessibility**: WCAG 2.1 AA compliance with screen reader support
- **🎯 Quality Analysis**: Integrated code quality assessment tools

## 🎯 **Core Features**

### 💬 **Enhanced AI Chat Interface**
- **Split-Screen Comparison**: Side-by-side model testing and evaluation
- **Context Visualization**: Real-time token usage with visual progress meters
- **Memory Management**: Color-coded conversation segments and context windows
- **Template System**: Collapsible prompt library with variable substitution
- **Model Flexibility**: Automatic detection of all locally available Ollama models
- **Conversation Forking**: Branch discussions at any point for exploration

### 🤖 **Intelligent Agents**
- **Visual Flow Editor**: Drag-and-drop agent creation with professional tools
- **Tiered Builder**: Beginner wizard mode and advanced configuration
- **Testing Sandbox**: Built-in agent testing and validation environment
- **Tool Integration**: Custom and built-in tools for enhanced capabilities
- **Knowledge Integration**: RAG support with document and data sources

### 📝 **Block-Based Notes Editor**
- **Modern Block System**: Slash commands (/) for instant block creation
- **Rich Content Types**: Text, headings, lists, code, images, embeds
- **Drag-and-Drop**: Visual block reordering and organization
- **Bidirectional Linking**: [[wiki-style]] links with auto-completion
- **AI Integration**: Contextual actions (summarize, expand, generate tasks)
- **Markdown Compatibility**: Full import/export with existing workflows

### ✅ **ADHD-Optimized Task Management**
- **Visual Kanban Board**: Drag-and-drop task organization with collapsible columns
- **Smart Task Lenses**:
  - **"Now" Lens**: Overdue and high-priority tasks
  - **"Today's Energy" Lens**: Tasks matched to current energy level
  - **"Quick Wins" Lens**: Sub-15-minute tasks for motivation
  - **"Focus Session" Lens**: Deep work tasks (25+ minutes)
- **Energy-Level System**: ⚡ High, 🕒 Medium, 😴 Low energy indicators
- **AI Task Breakdown**: Automatic sub-task generation with time estimates
- **Progress Tracking**: Visual indicators and completion feedback

### 📅 **Intelligent Calendar & Time Management**
- **Energy-Aware Scheduling**: AI recommendations based on energy patterns

## 📂 Project Structure

LibreOllama follows a clean, modular architecture:

```
LibreOllama/
├── LICENSE
├── README.md
├── docs/                     # 📚 COMPREHENSIVE DOCUMENTATION
│   ├── README.md            # Documentation index and guide
│   ├── development/         # Development setup guides
│   ├── archive/             # Historical documentation
│   ├── CANVAS_WHITEBOARD_REDESIGN.md
│   ├── COMPREHENSIVE_NEXT_STEPS_GUIDE.md
│   ├── CPU_SPIKE_DEBUG_GUIDE.md
│   ├── DASHBOARD_INTEGRATION_GUIDE.md
│   └── LIBREOLLAMA_UI_UX_TRANSFORMATION_ROADMAP.md
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── chat/           # Chat interface
│   │   ├── archive/        # Archived components
│   │   └── */              # Feature-specific components
│   ├── hooks/              # React hooks
│   │   └── archive/        # Archived hooks
│   └── lib/                # Utilities and helpers
└── src-tauri/              # Rust backend code
    └── src/
        ├── commands/       # Tauri commands
        └── database/       # Database functionality
```

### 📚 Documentation Overview

The **`docs/` folder** contains comprehensive documentation for LibreOllama:

- **[`docs/README.md`](./docs/README.md)** - Complete documentation index and navigation guide
- **Main Guides** - Feature documentation, debugging guides, and integration instructions
- **Development Guides** - Setup instructions, Rust backend development, and database configuration
- **Archive** - Historical documentation from all development phases

**💡 Start with [`docs/README.md`](./docs/README.md) for a complete overview of all available documentation.**

### Archive Directories

The project maintains several archive directories to preserve historical code and documentation:

- **`docs/archive/`**: Historical documentation from previous phases
- **`src/components/archive/`**: Outdated React components
- **`src/hooks/archive/`**: Outdated React hooks

These archives provide valuable context about the project's evolution and are documented with README.md files explaining their contents.

## 📚 Project History

LibreOllama has evolved through several major phases:

### Phase 1: Foundation
- Initial design system implementation
- Core architecture setup
- Basic UI components

### Phase 2: Core Features
- Chat interface implementation
- Template system
- AI integration with Ollama

### Phase 3: Advanced Features
- Memory management
- Bidirectional linking system
- Performance optimizations

### Phase 4: Unified Workspace
- Contextual sidebar
- Smart action bar
- Cross-feature connections

### Phase 5: External Integrations
- Google APIs integration
- Calendar functionality
- Email integration

### Architecture Evolution

The project began with a Next.js architecture but later transitioned to a Tauri desktop application with a Rust backend for improved performance, security, and offline capabilities. This transition is documented in the archive directories.

## 🚀 Getting Started

[... rest of the README continues as before ...]