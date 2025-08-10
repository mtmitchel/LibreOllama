# Phase 2: Critical Feature Integration (MVP Completion)

**Owner:** Auto-Finisher
**Status:** In Progress
**Last Updated:** 2025-01-17

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

* **[🔧] Notes system**

  * Build `notesStore.ts` ✅ Complete
  * Connect Tiptap editor + folder UI to backend ✅ Complete  
  * Enable full CRUD and persistence ✅ Complete
  * **Cursor alignment fix:** reduce oversized caret in the Tiptap editor and ensure text starts left-aligned (update CSS in `notes.css` and Tiptap configuration). ✅ Complete
  * **Notes modal editor check:** verify that the editor inside the Notes modal inherits the caret-size and left-alignment fixes; adjust styles or configuration if discrepancies remain. ✅ Complete
  * **Editor formatting issues:** fix any remaining text formatting problems including heading sizes, line-height consistency, bullet/numbered-list indentation, code-block styling, and paste-format cleanup. ✅ Complete
  * **[2025-01-17] Folder creation button:** ✅ Added missing FolderPlus button to sidebar header to trigger folder creation UI
  * **[2025-01-17] Export functionality:** ✅ Enhanced export system with comprehensive debugging, improved error handling, and proper file format support (PDF, DOCX, TXT)
  * **[2025-01-17] Move functionality:** ✅ Verified move-to-folder feature with debugging and notification system
  * **[2025-01-17] Tauri permissions:** ✅ Updated file system permissions in default.json to enable export functionality
  * Write **database integration tests** for note creation, renaming, editing, deletion, and reload (validate schema matches service expectations, following patterns from Implementation Guide)
  * Done when: Notes and folders persist and reload reliably with consistent editor formatting, folder creation works, and export/move features are fully functional

* **[ ] Projects feature**

  * Design DB schema and Tauri commands
  * Create `projectStore.ts`
  * **Database integration validation:** ensure schema matches service expectations and implement data transformation functions (apply lessons from Notes feature implementation)
  * **Service layer testing:** write comprehensive tests covering project CRUD operations, error handling, and backend integration (follow service integration patterns from Gmail feature)

* **[ ] Tasks management**

  * Build `useKanbanStore.ts` integration with Google Tasks API (already present) and ensure drag-and-drop between columns/lists works reliably.
  * **Drag tasks between columns:** fix any item-movement bugs and write RTL + dnd-kit tests verifying state updates.
  * **Calendar time-blocking:** enable dragging a task card onto the Calendar page (FullCalendar drop) to create a time-blocked event; write integration test that mocks FullCalendar `eventReceive` and asserts Google Calendar store update.
  * **API integration tests:** address critical testing gap (current score: 45/100) by implementing Google Tasks API integration tests, multi-account task management tests, and drag-and-drop visual testing (follow store-first testing patterns from Canvas)
  * Improve offline handling and sync edge cases.
  * Done when: Tasks can be moved between lists, dragged onto the calendar, sync without data loss, and have comprehensive API integration test coverage.

* **[ ] Roadmap MVP Validation**

  * **Read every feature roadmap page in `docs/roadmap/`** and cross-check that each item marked as _MVP Must-Haves_ is fully implemented and wired end-to-end.
  * Produce a short validation log with:
    1. Roadmap file path (link)
    2. Each MVP bullet ➜ ✅ Implemented / ❌ Missing / 🔧 Partial
    3. Links to code/tests proving implementation (e.g. `src/features/...` or specific test files)
  * File the summary in `progress/phase-2-<YYYY-MM-DD>.md`.
  * Done when: All roadmap MVP items are ✅ or have a corresponding task created in this Phase-2 list. 