# LibreOllama Documentation Index

Welcome to the LibreOllama documentation! This index provides a comprehensive guide to all available documentation, organized by category for easy navigation.

## 🚀 Quick Start

**New to LibreOllama?** Start here:
- **[Main README](../README.md)** - Project overview, tech stack, and development setup
- **[Canvas Complete Guide](./CANVAS_COMPLETE_GUIDE.md)** - Complete canvas documentation and user guide
- **[Development Startup Guide](./development/DEV-STARTUP-GUIDE.md)** - Set up your development environment

## 📚 Core Feature Documentation

### **🎨 Canvas/Whiteboard System**
Our professional-grade whiteboard powered by Konva.js provides rich visual thinking tools:
  - FigJam-style sections for organization
  - Advanced rich text editing with floating toolbars
  - Enhanced table operations with 8-handle resizing
  - Pan/zoom navigation and high-performance rendering
  - Multi-selection, connectors, and 50-state undo/redo

**Current Status**: Production-ready with ongoing architectural optimizations for 60fps performance.

**Complete Documentation**:
- **[Canvas Complete Guide](./CANVAS_COMPLETE_GUIDE.md)**  
  Master reference for all Canvas features, usage patterns, and technical architecture.
- **[Canvas Development Roadmap](./CANVAS_DEVELOPMENT_ROADMAP.md)** *(NEW)*  
  Development roadmap, implementation timeline, architectural refactoring plans, and performance optimization strategies.

*Note: All legacy Canvas documentation has been consolidated into these two comprehensive guides and archived.*

### **🎨 UI/UX Design System**
Comprehensive documentation of our design system, components, and user experience improvements.

- **[Design System Documentation](./design-system/)** - Component library and design guidelines

### **📝 Rich Text & Notes**
- **[Notes Rich Text Implementation](./NOTES_RICH_TEXT_IMPLEMENTATION_SUMMARY.md)** - Rich text editor implementation details and features

### **📊 Dashboard & Testing**
- **[Dashboard Testing Validation Guide](./DASHBOARD_TESTING_VALIDATION_GUIDE.md)** - Testing procedures for dashboard widgets and components

## 🛠️ Developer Documentation

### **Environment Setup**
- **[Development Startup Guide](./development/DEV-STARTUP-GUIDE.md)** - Complete development environment setup
- **[Dev Server Guide](./development/DEV-SERVER-GUIDE.md)** - Running and configuring the development server

### **Backend Development**
- **[Rust Development Setup](./development/RUST_DEVELOPMENT_SETUP.md)** - Rust backend development with Tauri
- **[Database Setup](./development/DATABASE_SETUP.md)** - Local database configuration and management

## 🗂️ Historical Documentation

### **Completed Phases**
The [`completed-phases/`](./completed-phases/) folder contains:
- **[Canvas Cleanup Summary](./completed-phases/CANVAS_CLEANUP_SUMMARY.md)** - Documentation consolidation and cleanup report
- **[Konva Implementation Complete](./completed-phases/KONVA_IMPLEMENTATION_COMPLETE.md)** - Migration from Fabric.js to Konva.js documentation
- **[UI Implementation Complete](./completed-phases/UI_IMPLEMENTATION_COMPLETE.md)** - Consolidated report of all UI/UX improvements and design system consolidation

### **Project Archives**
The [`../archives/`](../archives/) folder contains:
- **`consolidated_canvas_archive_2025/`** - All historical canvas implementations and documentation
- **`src_backup_20250606/`** - Source code backup

## 📋 Documentation Organization

### **Current Active Documentation** (7 files)

- 4 Canvas/Whiteboard guides (Complete docs, Enhanced tables, Implementation, Table duplication fix)
- 1 Notes/Rich text guide
- 1 Dashboard testing guide
- 1 Design system guide (2 files in design-system/)
- 4 Development setup guides (in development/)

### **Root Directory Documentation**
- **[Canvas Complete Documentation](./CANVAS_COMPLETE_DOCUMENTATION.md)** - Complete canvas reference and implementation details

## 📝 Documentation Guidelines

### **For Contributors**
1. **Start with the main guides above** for current features and implementation details
2. **Consult the development guides** for setup and backend development  
3. **Reference the archive** for historical context or completed implementation details
4. **Follow the consolidated structure** - avoid creating duplicate documentation

### **For Users**
1. **Begin with the [Main README](../README.md)** for project overview
2. **Use [Canvas Complete Documentation](./CANVAS_COMPLETE_DOCUMENTATION.md)** to get started with the whiteboard
3. **Refer to feature-specific guides** for detailed usage instructions

---

*This index is maintained as the single source of truth for LibreOllama documentation. All documentation has been consolidated and organized to reduce clutter and improve navigation. For the most up-to-date project status, see the main [README.md](../README.md) in the project root.*
