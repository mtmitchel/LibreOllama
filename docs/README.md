# LibreOllama Documentation Index

Welcome to the LibreOllama documentation! This index provides a comprehensive guide to all available documentation, organized by category for easy navigation.

## 🚀 Quick Start

**New to LibreOllama?** Start here:
- **[Main README](../README.md)** - Project overview, tech stack, and development setup
- **[Canvas Documentation](./CANVAS_COMPLETE_DOCUMENTATION.md)** - Complete canvas documentation and user guide
- **[Development Startup Guide](./development/DEV-STARTUP-GUIDE.md)** - Set up your development environment

## 📚 Core Feature Documentation

### **🎨 Canvas/Whiteboard System**
Our professional-grade whiteboard is powered by Konva.js for high performance and rich interactions. Features **FigJam-style sections** for hierarchical organization, advanced rich text editing with floating toolbar, and comprehensive visual feedback systems.

**Current Status**: Canvas system is functional with active development. **Recent fixes (June 16, 2025)**: Critical text input issues resolved including letter reversal bugs, cursor position problems, and selection behavior issues. Table functionality includes 8-handle resize system, optimized performance, and improved code quality.

- [Canvas Complete Documentation](CANVAS_COMPLETE_DOCUMENTATION.md) - Main canvas system overview with section system, advanced text editing, implementation details, and recent bug fixes
- [Canvas Tables Documentation](CANVAS_TABLES.md) - Consolidated table functionality, implementation details, and technical specifications
- [Canvas Architecture Analysis](CANVAS_ARCHITECTURE_ANALYSIS.md) - Technical architecture details and component structure

> **Note**: Previous redundant table documentation files have been consolidated and archived in `../archives/consolidated_canvas_archive_2025/redundant_table_docs/`


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
