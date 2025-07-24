# Phase 2: Critical Feature Integration (MVP Completion)

**Owner:** Auto-Finisher
**Status:** In Progress
**Last Updated:** 2025-01-23

---

## ✯ Objective

Implement all MVP features with live data persistence, frontend-backend connectivity, and a clean, stable architecture.

---

## 🔒 Global Guardrails

* **Git restrictions** – Do **not** stage, commit, or push any changes without explicit approval. All work must remain local.
* **Logging** – For each completed task, append a timestamped entry to `progress/phase-2-<YYYY-MM-DD>.md` with a summary of actions taken.
* **Phase completion signal** – When all success criteria are met, log `PHASE-2 COMPLETE` in the progress file and pause for review.
* **Web search fallback** – If you encounter an unknown error or test failure and cannot resolve it from local context, use the `Search` tool to find documentation or solutions. Summarize findings before applying fixes.

  * Prioritize results from:

    * `vitejs.dev`
    * `testing-library.com`
    * `tauri.app`
    * `npmjs.com`
    * `stackoverflow.com`
    * `github.com` issues/discussions
* **Learn from passing tests** – Examine passing tests to understand correct mocks, setup, and test-layer structure. Use them as reference models.
* **Test-driven reinforcement** – Apply patterns and insights from working test cases to improve production code structure, mocks, and service layers when relevant. Tests are not isolated—they should reinforce and align with production behavior.
* **Follow testing strategy** – Thoroughly review the [`Implementation Guide`](../docs/IMPLEMENTATION_GUIDE.md) before changing any test logic.
* **Avoid redundancy** – Reuse existing helpers, services, and patterns. Do not reimplement logic already present.
* **Codebase hygiene** – Archive outdated, unused, or legacy code to the appropriate `docs/_archive/` directory. Keep all active code organized, lean, and professional. Maintain consistent structure and eliminate clutter as part of every task.
* **No silent suppression** – Do not disable TypeScript, ESLint, or testing rules (e.g., `// @ts-ignore`, `eslint-disable`, `test.skip`) unless explicitly approved and logged with justification.
* **Comment discipline** – Write clear, minimal, purposeful comments. Avoid redundant, outdated, or misleading comments. Always update or remove comments when logic changes.
* **Consistent naming and structure** – Follow project naming conventions across files, variables, and functions. Structure all new code to align with existing folder/module patterns.
* **Test-driven mindset** – Where practical, add or update tests before implementing logic changes. Never introduce or modify production logic without validating it through tests.
* **No stale TODOs** – Remove stale `TODO:` and `FIXME:` comments. If a TODO is valid, log it in `progress/BLOCKERS.md` or as a Phase 3 refactor candidate.
* **Single-responsibility principle** – Avoid feature bloat. Do not combine unrelated fixes, features, or refactors in a single task. Keep changes atomic and focused.
* **Use of constants and shared utilities** – Avoid hardcoded values. Prefer central configuration/constants files and shared utility modules wherever possible.
* **Security-first mindset** – Always sanitize inputs, validate data from external sources, and follow security best practices to prevent common vulnerabilities (like XSS or data injection). Treat security as an integral part of development, not an afterthought.
* **Accessibility (A11y) by default** – Ensure all UI components are accessible from the start. Use semantic HTML, manage focus, provide ARIA attributes where necessary, and test for keyboard navigability and screen reader compatibility.
* **Robust error handling** – Implement graceful error handling for all asynchronous operations, API calls, and potential failure points. Avoid silent failures and provide clear, user-friendly error messages.
* **Prudent dependency management** – Carefully evaluate any new third-party dependencies for security, maintenance, and performance impact. Prefer well-supported libraries and avoid adding dependencies for trivial tasks that can be handled with native code.
* **Roadmap authority** – This document defines your task list. Do not invent, reprioritize, or abandon work.
* **Escalation protocol** – If blocked, log the issue in `progress/BLOCKERS.md`, then continue with the next available task.

---

## 🧰 Full Task List

### ✅ Core Feature Integrations

* **[ ] Chat system**

  * Build `chatStore.ts`
  * Connect UI to Tauri commands and Ollama
  * **Integrate Ollama front-end service:** wire `ollamaService.ts` into the chat components so user prompts stream directly to Ollama and responses appear in real time
  * **Add multi-provider LLM support:** create an extensible provider layer and integrate OpenAI, Anthropic (Claude), OpenRouter, DeepSeek, Mistral, etc. Provider selection must be runtime-switchable.
  * **Settings modal – API-key management:** add a secure UI that lets users add, update, or delete provider keys. Persist keys via Tauri secure storage and validate before saving.
  * **Context-menu (right-click) on chat messages:** show options such as Copy, Edit, Delete, and Resend. Implement with accessible menu patterns and keyboard support.
  * **Image / file uploader:** convert the paper-clip icon to a working uploader that accepts images and files, shows upload progress, and displays attachments in the chat stream.
  * Replace mock data with live data
  * Write **comprehensive integration tests** covering provider services, key-management flows, context-menu actions, attachment uploads, history persistence, real-time streaming, and provider switching (follow testing patterns from Canvas/Gmail features)
  * Done when: Users can switch providers, manage API keys, upload files/images, use the context menu, and see persisted chat history with live AI responses

* **[✅] Notes system** _(COMPLETED)_

  * ✅ Build `notesStore.ts` - Fully implemented with Zustand + Immer
  * ✅ ~~Connect Tiptap editor + folder UI to backend~~ **Migrated to BlockNote editor** - Complete integration with backend
  * ✅ Enable full CRUD and persistence - All operations working (create, read, update, delete notes/folders)
  * ✅ ~~**Cursor alignment fix**~~ **BlockNote migration resolved** all Tiptap formatting issues
  * ✅ ~~**Notes modal editor check**~~ **BlockNote provides superior formatting** out of the box
  * ✅ ~~**Editor formatting issues**~~ **BlockNote handles** headings, lists, code blocks, and paste formatting automatically
  * ✅ Write **comprehensive test coverage** - 36 passing tests (100% success rate) covering store integration, UI workflows, data loading, editor integration, and error handling
  * ✅ **Testing strategy optimization** - Archived 3 implementation detail tests in favor of user-focused behavioral tests (see `_archive/StoreServiceCallTests.md`)
  * ✅ **Archived legacy Tiptap components** - CustomTable, LinkDialog, SlashCommandMenu moved to `_archive/`
  * ✅ **Migration script implemented** - Automatic Tiptap → BlockNote content migration
  * **Status:** Production ready - Users can create, edit, organize notes in folders with rich BlockNote editor
  * Done when: ✅ **COMPLETED** - Notes and folders persist and reload reliably with excellent editor experience

* **[ ] Projects feature**

  * Design DB schema and Tauri commands
  * Create `projectStore.ts`
  * **Database integration validation:** ensure schema matches service expectations and implement data transformation functions (apply lessons from Notes feature implementation)
  * **Service layer testing:** write comprehensive tests covering project CRUD operations, error handling, and backend integration (follow service integration patterns from Gmail feature)

* **[🔧] Tasks management** _(PARTIAL COMPLETION - 2025-01-23)_

  * ✅ Build `useKanbanStore.ts` integration with Google Tasks API - **Dynamic columns from Google Task lists**
  * ✅ **Drag tasks between columns:** Kanban drag-and-drop working with state updates and Google Tasks sync
  * ✅ **Calendar time-blocking:** Tasks can be dragged directly onto calendar creating 1-hour events without modal
  * ✅ **Two-way sync implementation:** Created `kanbanGoogleTasksSync.ts` service with 5-minute auto-sync
  * ✅ **Task sorting:** Implemented sort by "My order", "Date", and "Title" in both Kanban and Calendar views
  * ✅ **Right-click context menu:** Added context menu for quick task actions (edit, complete, duplicate, delete)
  * ✅ **Duplicate prevention:** Using Google Task IDs as source of truth to prevent duplicates
  * [ ] **API integration tests:** Still need comprehensive test coverage (current score: 45/100) - implement Google Tasks API integration tests, multi-account task management tests, and drag-and-drop visual testing
  * [ ] Improve offline handling and sync edge cases
  * Done when: ✅ Tasks can be moved between lists, dragged onto calendar, sync without data loss | ❌ Need comprehensive API integration test coverage

* **[ ] Roadmap MVP Validation**

  * **Read every feature roadmap page in `docs/roadmap/`** and cross-check that each item marked as _MVP Must-Haves_ is fully implemented and wired end-to-end.
  * Produce a short validation log with:
    1. Roadmap file path (link)
    2. Each MVP bullet ➜ ✅ Implemented / ❌ Missing / 🔧 Partial
    3. Links to code/tests proving implementation (e.g. `src/features/...` or specific test files)
  * File the summary in `progress/phase-2-<YYYY-MM-DD>.md`.
  * Done when: All roadmap MVP items are ✅ or have a corresponding task created in this Phase-2 list.

---

## 🎯 Success Criteria

1. All marked MVP features are fully functional with live backend connections
2. Integration tests pass for each core feature
3. No hardcoded/mock data remains in production flows
4. Users can perform full CRUD operations on all data types
5. Authentication and persistence work reliably across app restarts

---

## 📊 Progress Summary (2025-01-23)

### Major Accomplishments
- **Calendar Integration:** Fixed month display, shows ALL Google calendars, direct task drop, event resizing
- **Tasks Management:** Dynamic Kanban columns from Google Task lists, two-way sync with 5-minute intervals
- **UI/UX Enhancements:** Right-click context menus, task sorting, fixed overflow issues
- **Performance:** Fixed slow mail loading with lazy loading approach

### Remaining Work
- **Chat System:** Entire feature needs implementation
- **Projects Feature:** Needs design and implementation  
- **Tasks Testing:** Critical gap in API integration test coverage
- **Roadmap Validation:** Need to audit all MVP features

### Status
PHASE-2 IN PROGRESS - Significant progress on Calendar and Tasks integration