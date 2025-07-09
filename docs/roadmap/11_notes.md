**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Notes Roadmap

This document provides a comprehensive overview of the Notes feature, including its current implementation details and future development plans.

## Current Implementation

The Notes feature is a powerful, block-based text editor built using Tiptap, with a file-system-like folder structure for organization.

### Frontend Architecture

- **Editor Engine:** The core of the feature is the **Tiptap** editor (`TiptapEditor.tsx`). Tiptap is a headless editor framework, which gives us full control over the look and feel.
- **Component Structure:** The feature is composed of several key components found in `src/features/notes/components/`:
    - `BlockEditor.tsx`: The main component that brings together the editor and its UI elements.
    - `FolderTree.tsx`: A component for displaying and navigating a hierarchical folder structure.
    - `TiptapFixedToolbar.tsx`: A toolbar that is fixed at the top of the editor.
    - `TiptapSlashCommand.tsx`: A slash command menu that allows for quick insertion of blocks and other elements.
- **State Management:** State is currently managed within the React components. There is no dedicated store for notes and folders yet.

### Backend Architecture

- **No Backend Implementation:** There are currently **no backend services, Tauri commands, or database tables** for saving notes or folders. The feature is client-side only at the moment.

### Implemented Features

- A rich text editor based on Tiptap.
- A fixed toolbar and a slash command menu.
- A folder tree for organizing notes.
- A clean, modern UI for note-taking.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [x] **Tiptap Block Editor:** A rich-text, block-based editor. *(Existing)*
- [ ] **Folder Tree CRUD:** Backend and frontend for creating, reading, updating, and deleting notes and folders.
- [ ] **Persistent Storage:** Connect the editor to the backend to save and load notes from the database.
- [ ] **Search:** Basic search functionality by note title or content.

### Post-MVP Enhancements

- [ ] **Rich Media:** Embed images and other media into notes.
- [ ] **Tagging:** Add a tagging system to organize and filter notes.
- [ ] **Note Templates:** Create reusable templates for different types of notes.
- [ ] **Sharing & Collaboration:** Deferring all real-time collaboration and sharing features.

### Future Vision & "Wow" Delighters

- [ ] **Bi-directional Linking:** Create links between notes with a graph view, similar to Obsidian.
- [ ] **AI Summarization:** AI-powered tools to summarize long notes.
- [ ] **Quick Linking:** Easily create links to/from tasks and calendar events.
- [ ] **Version History:** A diff viewer to see changes to a note over time.

### UX/UI Improvements

- [ ] **Slash Command UX:** Refine the user experience of the slash command menu.
- [ ] **Folder Tree Drag-and-Drop:** Improve drag-and-drop for reorganizing notes and folders.
- [ ] **Note Metadata:** Design and implement the `NoteMetadata.tsx` component to display word count, last updated time, etc.

### Technical Debt & Refactoring

- [ ] **Backend Implementation:**
    - [ ] Design the database schema for storing notes (JSON/HTML) and folders.
    - [ ] Create backend services in Rust for all note/folder CRUD operations and expose them via Tauri.
- [ ] **Dedicated Notes Store:** Create a dedicated Zustand store (`notesStore.ts`) to manage state.
- [ ] **Finalize Editor Functionality:** Ensure all buttons on the toolbar and options in the slash command are fully functional.
- [ ] **Test Coverage:** Add comprehensive tests for the Tiptap editor and its custom extensions.
- [ ] **Documentation:** Document the custom Tiptap extensions and the notes feature architecture. 