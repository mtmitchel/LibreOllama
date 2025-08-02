# Changelog

All notable changes to the LibreOllama project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-01-27

### 🔧 Recent Fixes

#### Calendar Timezone & Date Handling Fixes ✅
- **Fixed timezone-related date rollback issues** ✅
  - Resolved tasks showing one day behind in sidebar after drag-and-drop to calendar
  - Fixed Edit task modal displaying incorrect dates due to UTC conversion
  - Simplified date handling to use YYYY-MM-DD format consistently throughout the system
  - Removed complex timezone offset calculations that were causing date discrepancies
  - Ensured timeBlock data is preserved when editing task titles
  - Added parseTaskDueDate helper function to handle RFC3339 date formats correctly
  - Location: `src/app/pages/calendar/` components

### ✅ Recently Completed

#### Task System Architecture Refactor ✅
- **Complete Unification of Task Stores** ✅
  - Eliminated the "four-headed hydra" of fragmented stores (useKanbanStore, googleTasksStore, taskMetadataStore)
  - Consolidated all task management into single unifiedTaskStore
  - Removed all compatibility shims and "architectural cowardice" layers
  - Updated all components to use unified store exclusively
  - Fixed stable local ID system preventing React remounting issues
  - Achieved true single source of truth for task management
  - Location: `src/stores/unifiedTaskStore.ts` with archived old stores

### ✅ Previous Major Completions

#### Documentation & Project Organization ✅
- **Complete Documentation Overhaul** ✅
  - Consolidated 40+ fragmented documentation files into 4 core documents
  - Created comprehensive Production Readiness Plan merging 3 phase documents
  - Built unified Design System guide with colors, typography, components, and animations
  - Established comprehensive Testing Strategy with modern patterns
  - Reorganized roadmap structure with feature-specific specifications
  - Location: `docs/` directory with professional index structure

- **Codebase Cleanup & Organization** ✅
  - Removed 13+ temporary log files and build artifacts from root directory
  - Archived 18+ redundant documentation files with proper categorization
  - Eliminated 5MB+ of unnecessary files and duplicates
  - Consolidated archive structure into organized categories (canvas, gmail, design, testing)
  - Created professional root directory structure following industry standards
  - Location: Root directory and `docs/_archive/` with organized subcategories

#### UI/UX Improvements ✅
- **Mail Interface Enhancement** ✅
  - Redesigned email viewing from split-screen to centered modal overlay
  - Fixed HTML entity decoding in email subjects (e.g., "We're" instead of "We&#39;re")
  - Removed blue unread indicators for cleaner email list appearance
  - Integrated reply functionality directly into message view modal
  - Updated context menu to match Gmail's exact menu structure
  - Set external images to display by default
  - Location: `src/features/mail/components/`

- **Navigation System Enhancement** ✅
  - Added collapsible sidebar with PanelLeft toggle icon (consistent with mail panels)
  - Implemented clean minimal UI when collapsed (40px width with only toggle visible)
  - Added smooth transitions between open/closed states
  - Improved spacing and visual balance in expanded state
  - Location: `src/components/navigation/Sidebar.tsx`

#### Notes System Migration ✅
- **Complete BlockNote Editor Integration** ✅
  - Successfully migrated from Tiptap to BlockNote editor for superior rich text experience
  - Implemented automatic content migration from legacy Tiptap format
  - Added comprehensive test coverage with 36 passing tests (100% success rate)
  - Enhanced folder organization and note persistence
  - Archived legacy Tiptap components for historical reference
  - Location: `src/features/notes/` with `_archive/` for legacy components

### ✅ Previous Major Completions

#### Gmail Integration System ✅
- **Real Gmail API Integration** ✅
  - Implemented secure OAuth2 flow with PKCE protection
  - Added OS keyring integration for secure token storage
  - Created comprehensive Gmail API service with message operations
  - Built automatic pagination and background sync (5-minute intervals)
  - Added attachment handling with security validation
  - Location: `src/features/mail/` and `src-tauri/src/commands/gmail/`

- **Email Client Features** ✅
  - Complete email reading, composition, and sending functionality
  - Advanced search with Gmail operators
  - Label management and organization
  - Thread grouping and conversation view
  - Attachment preview and download system
  - Location: `src/features/mail/components/` and services

#### Canvas System ✅
- **Complete Visual Content Creation** ✅
  - Implemented 15+ element types (shapes, text, images, tables, connectors)
  - Built sophisticated drawing tools (pen, pencil, eraser, highlighter)
  - Created smart connector system with auto-snap and FigJam-like behavior
  - Added section tool for content organization with auto-capture
  - Implemented 50-state undo/redo system
  - Added viewport culling for performance optimization
  - Location: `src/features/canvas/` with comprehensive component library

#### Tasks & Calendar Integration ✅
- **Google Services Integration** ✅
  - Complete Google Calendar and Tasks API integration
  - Dynamic Kanban board with Google Task lists as columns
  - Drag-and-drop functionality between task columns and calendar
  - Two-way synchronization with Google services
  - Time-blocking functionality with calendar event creation
  - Location: `src/app/pages/Tasks.tsx`, `src/app/pages/Calendar.tsx`

### 🚧 Work In Progress

#### Chat System Implementation
- **Multi-Provider LLM Integration** 🚧
  - Need to implement chatStore.ts with Zustand state management
  - Add support for OpenAI, Anthropic, OpenRouter, and local models
  - Create secure API key management interface
  - Implement file/image upload functionality
  - Add message persistence and conversation history
  - Target: Phase 2 completion

#### Projects Feature
- **Project Management System** 🚧
  - Design database schema for project persistence
  - Implement projectStore.ts for state management
  - Create project CRUD operations
  - Add task association and organization features
  - Target: Phase 2 completion

### 🔧 Technical Status

#### Core Systems Status
- **Canvas System**: ✅ 100% Complete - Production ready with all drawing tools and features
- **Gmail Integration**: ✅ 95% Complete - Minor UI polish remaining
- **Notes System**: ✅ 100% Complete - BlockNote migration successful
- **Tasks Management**: ✅ 95% Complete - Unified store refactor complete, minor testing remains
- **Calendar Integration**: ✅ 90% Complete - Missing recurring event support
- **Navigation & UI**: ✅ 95% Complete - Recent improvements completed
- **Chat System**: 🔴 0% Complete - Requires full implementation
- **Projects Feature**: 🔴 0% Complete - Requires design and implementation

#### Backend Services (Rust/Tauri)
- **Gmail API Integration**: ✅ Working - Full OAuth2 flow with secure token storage
- **Google Calendar API**: ✅ Working - Event sync with proper authentication
- **Google Tasks API**: ✅ Working - Task management with real-time updates
- **SQLite Database**: ✅ Working - All database operations with proper migrations
- **Secure Token Storage**: ✅ Working - Encrypted credential storage
- **Background Sync**: ✅ Working - Efficient data synchronization

#### Design System & Quality
- **Component Library**: ✅ Working - 15+ reusable components with Ladle stories
- **Design System**: ✅ Complete - Comprehensive design tokens and guidelines
- **Theme System**: ✅ Working - Light/dark mode with proper token management
- **Testing Framework**: ✅ Working - Vitest with vanilla Zustand patterns
- **Documentation**: ✅ Complete - Professional structure with clear navigation
- **Code Organization**: ✅ Complete - Clean, professional codebase structure

### 🎯 Current Development Phase

**Phase 2: Critical Feature Integration (70% Complete)**
- Canvas System ✅ (100%)
- Gmail Integration ✅ (95%) 
- Notes System ✅ (100%)
- Tasks Management ✅ (95%)
- Calendar Integration 🟡 (90%)
- Chat System 🔴 (0%)
- Projects Feature 🔴 (0%)

**Next Priority**: Complete Chat system and Projects feature to finish Phase 2, then proceed to Phase 3 hardening and polish.

### 📋 Quality Metrics

- **TypeScript Errors**: 0 (Zero errors policy maintained)
- **Test Coverage**: 80%+ for implemented features
- **Documentation Coverage**: 100% (All features documented)
- **Code Organization**: Professional industry standards
- **Performance**: 60fps animations, optimized renders
- **Security**: OAuth2 + PKCE, OS keyring integration

---

*For detailed implementation status and roadmap, see [Production Readiness Plan](docs/PRODUCTION_READINESS.md)*