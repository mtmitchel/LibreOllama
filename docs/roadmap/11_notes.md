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

- **Editor Engine:** Complete **BlockNote** implementation with rich block-based editing capabilities.
- **Component Structure:** Full component suite in `src/features/notes/components/`:
    - `BlockNoteEditor.tsx`: Main BlockNote editor component with rich text editing
    - `NotesPage.tsx`: Main notes page with folder navigation and editor integration
    - `Sidebar.tsx`: Sidebar with folder tree, search, and note management
    - `FormattingToolbar.tsx`: Rich text formatting toolbar
    - `CustomFormattingToolbar.tsx`: Enhanced formatting options
    - `CustomSlashMenu.tsx`: Slash command menu for quick block insertion
    - `BrowserLikeContextMenu.tsx`: Context menu for editor operations
    - `BlockNotePopover.tsx`: AI writing tools integration popover
    - `ImageUploadModal.tsx`: Image upload functionality
    - `LinkModal.tsx`: Link insertion and editing
    - `AlignmentMenu.tsx`: Text alignment options
    - `ContextualToolbar.tsx`: Context-aware toolbar
    - `NotesContextSidebar.tsx`: Contextual sidebar for notes
- **State Management:** Uses Zustand store (`notes/store.ts`) for note and folder state
- **Backend Integration:** Partial integration with backend services via `notesService.ts`

### Backend Architecture

- **Complete Tauri Commands:** Full implementation in `src-tauri/src/commands/`:
    - `notes.rs`: All note operations (create, read, update, delete, search)
    - `folders.rs`: All folder operations (create, read, update, delete, hierarchical)
- **Database Operations:** Complete SQLite operations in `src-tauri/src/database/operations/`:
    - `note_operations.rs`: Full CRUD, search, tagging capabilities
    - `folder_operations.rs`: Hierarchical folder management with recursive operations
- **Database Models:** Complete models for Notes and Folders with proper relationships.

### Implemented Features

**Frontend (BlockNote Editor):**
- ✅ Rich block-based editor with BlockNote
- ✅ Slash commands for quick block insertion
- ✅ Formatting toolbar with rich text options
- ✅ Context menus and alignment tools
- ✅ Image upload with modal interface
- ✅ Link insertion and editing
- ✅ AI writing tools integration via popover
- ✅ Hierarchical folder navigation
- ✅ Note and folder state management with Zustand
- ✅ Basic backend integration for notes CRUD

**Backend (Complete Implementation):**
- ✅ Full CRUD operations for notes and folders
- ✅ Hierarchical folder management
- ✅ Search functionality with content indexing
- ✅ Tag management system
- ✅ Database persistence with SQLite
- ✅ Complete Tauri command interface

### Current Implementation Gaps

- **Search Integration:** Frontend search UI exists but not fully connected to backend search
- **Folder Operations:** Some folder CRUD operations still use mock implementations
- **Auto-save:** No automatic saving of note content during editing
- **Error Handling:** Limited error handling for failed operations
- **Loading States:** Missing loading indicators during async operations

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

- [x] **BlockNote Editor:** Rich-text, block-based editor with slash commands. *(Completed)*
- [x] **Backend Services:** Complete backend implementation with database persistence. *(Completed)*
- [x] **Note CRUD:** Basic create/read/update/delete for notes with backend integration. *(Completed)*
- [x] **Folder Hierarchy:** Hierarchical folder structure with navigation. *(Completed)*
- [x] **AI Writing Tools:** Integration with AI writing tools via popover. *(Completed)*
- [ ] **Complete Search Integration:** Fully connect frontend search to backend search API.
- [ ] **Auto-save Implementation:** Add automatic saving during note editing.
- [ ] **Complete Folder CRUD:** Replace remaining mock folder operations with backend calls.

### Post-MVP Enhancements

- [ ] **Rich Media:** Embed images and other media into notes.
- [ ] **Tagging System:** Enhanced tagging with tag management UI.
- [ ] **Note Templates:** Create reusable templates for different types of notes.
- [ ] **Export Functionality:** Export notes as PDF, Markdown, or other formats.
- [ ] **DOCX Export:** Investigate and implement a robust solution for exporting notes to `.docx` format.

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

### Phase 3 Hardening Tests

- **Cross-feature workflow tests:** embed a Canvas snippet inside a Note, link that Note to a Project, reload, and verify all references remain valid.
- **Cold-boot persistence:** create/edit a note, reload the app, assert editor content, formatting, and metadata are fully re-hydrated.
- **Accessibility audit:** keyboard navigation for Tiptap fixed toolbar, slash command menu, and folder tree must pass `axe-core` with zero critical violations. 