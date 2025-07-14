**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Notes Roadmap

This document provides a comprehensive overview of the Notes feature, including its current implementation details and future development plans.

## Current Implementation

The Notes feature has comprehensive backend services and a rich frontend UI, but **lacks integration between the two layers**. The frontend operates with mock data while a complete backend implementation exists but remains unused.

### Critical Integration Gap

**MAJOR ISSUE:** The Notes feature has a **complete, production-ready backend** but the **frontend is not connected to it**:
- Frontend uses mock data instead of calling backend services
- Folder create/delete operations show alerts instead of API calls
- No search implementation on frontend despite complete backend search functionality
- Changes are not persisted to database
- Note saving operations do not integrate with backend persistence

### Frontend Architecture

- **Editor Engine:** Complete **Tiptap** implementation (`TiptapEditor.tsx`) with rich text editing capabilities.
- **Component Structure:** Full component suite in `src/features/notes/components/`:
    - `BlockEditor.tsx`: Main editor component with block-based architecture
    - `NotesEditor.tsx`: Notes editor with title editing, status management, and Tiptap integration
    - `FolderTree.tsx`: Hierarchical folder navigation component
    - `NotesSidebar.tsx`: Sidebar for folder and note navigation
    - `TiptapFixedToolbar.tsx`: Fixed toolbar with formatting options
    - `TiptapSlashCommand.tsx`: Slash command menu for quick formatting
    - `NotesEmptyState.tsx`: Empty state component
    - `TiptapContextMenu.tsx`: Context menu for editor operations
    - `TiptapSlashExtension.tsx`: Slash command extension system
    - `CustomTable.ts`: Table functionality integration
    - `LinkDialog.tsx`: Link insertion dialog
    - `Sidebar.tsx`: Main sidebar with search and folder management
- **Mock Data Usage:** Frontend uses mock data and is **not connected to backend services**.
- **Type Definitions:** Complete TypeScript definitions for Notes, Folders, and Blocks.

### Backend Architecture

- **Complete Tauri Commands:** Full implementation in `src-tauri/src/commands/`:
    - `notes.rs`: All note operations (create, read, update, delete, search)
    - `folders.rs`: All folder operations (create, read, update, delete, hierarchical)
- **Database Operations:** Complete SQLite operations in `src-tauri/src/database/operations/`:
    - `note_operations.rs`: Full CRUD, search, tagging capabilities
    - `folder_operations.rs`: Hierarchical folder management with recursive operations
- **Database Models:** Complete models for Notes and Folders with proper relationships.

### Implemented Backend Features (Unused)

- Rich text editor with Tiptap (slash commands, toolbar, block-based editing)
- Complete backend API with database persistence
- Search functionality (backend implemented)
- Hierarchical folder structure (backend implemented)
- Full CRUD operations for notes and folders (backend ready)

### Implemented Frontend Features (Mock Data Only)

- Rich text editor with Tiptap interface
- Note creation and editing UI (not persisted)
- Folder navigation UI (not functional)
- Search interface (not connected to backend)

### Missing Components Documentation

**Editor Enhancement Components:**
- `TiptapContextMenu.tsx` - Context menu for editor with formatting options
- `TiptapSlashExtension.tsx` - Slash command extension for quick formatting
- `CustomTable.ts` - Table functionality for the editor
- `LinkDialog.tsx` - Link insertion dialog component

**Sidebar & Navigation Components:**
- `Sidebar.tsx` - Notes sidebar with folder tree and search functionality
- `FolderTree.tsx` - Hierarchical folder navigation component
- `NotesSidebar.tsx` - Sidebar for folder and note navigation
- `NotesEmptyState.tsx` - Empty state component for notes

**Editor Components:**
- `TiptapEditor.tsx` - Main Tiptap editor component with rich functionality
- `TiptapFixedToolbar.tsx` - Fixed toolbar with formatting options
- `TiptapSlashCommand.tsx` - Slash command menu implementation
- `BlockEditor.tsx` - Block-based editor component
- `NotesEditor.tsx` - Notes editor with title editing and status management

**Service Integration:**
- `notesService.ts` - Frontend service layer for notes operations

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### High Priority / Critical Integration

- [ ] **Frontend-Backend Integration:** Connect existing frontend to existing backend services.
    - [ ] Replace mock data with API calls to backend
    - [ ] Implement actual folder create/delete operations
    - [ ] Connect note saving to backend persistence
    - [ ] Add error handling and loading states
- [ ] **Search Implementation:** Connect frontend search to existing backend search functionality.
- [ ] **Data Persistence:** Ensure all frontend changes are saved to database.

### MVP Must-Haves

- [x] **Tiptap Block Editor:** A rich-text, block-based editor. *(Existing)*
- [x] **Backend Services:** Complete backend implementation with database persistence. *(Existing)*
- [ ] **Folder Tree CRUD:** Connect frontend folder operations to backend services.
- [ ] **Note CRUD:** Implement create/read/update/delete for notes, including editor integration and backend persistence.
- [ ] **Search Functionality:** Implement search UI connected to backend search.
- [ ] **Root-level Notes:** Allow creating and viewing notes without assigning to a folder (default root level).
- [ ] **Folder Hierarchy & Note Nesting:** Support nested folders and allow users to organize notes hierarchically within any folder.

### Post-MVP Enhancements

- [ ] **Rich Media:** Embed images and other media into notes.
- [ ] **Tagging System:** Enhanced tagging with tag management UI.
- [ ] **Note Templates:** Create reusable templates for different types of notes.
- [ ] **Export Functionality:** Export notes as PDF, Markdown, or other formats.

### Future Vision & "Wow" Delighters

- [ ] **Bi-directional Linking:** Create links between notes with a graph view.
- [ ] **AI Summarization:** AI-powered tools to summarize long notes.
- [ ] **Quick Linking:** Easily create links to/from tasks and calendar events.
- [ ] **Version History:** A diff viewer to see changes to a note over time.

### UX/UI Improvements

- [ ] **Enhanced Slash Commands:** Expand slash command menu with more options.
- [ ] **Folder Drag-and-Drop:** Implement drag-and-drop for reorganizing notes and folders.
- [ ] **Note Metadata Display:** Complete the `NoteMetadata.tsx` component.
- [ ] **Keyboard Shortcuts:** Add comprehensive keyboard shortcuts for power users.

### Technical Debt & Refactoring

- [ ] **Service Layer:** Create a frontend service layer to abstract backend API calls.
- [ ] **Notes Store:** Create a dedicated Zustand store (`notesStore.ts`) for state management.
- [ ] **API Integration:** Create consistent API calling patterns with proper error handling.
- [ ] **Type Safety:** Ensure frontend types match backend API contracts.
- [ ] **Test Coverage:** Add comprehensive tests for both frontend components and backend integration.
- [ ] **Documentation:** Document the Notes API and frontend integration patterns. 