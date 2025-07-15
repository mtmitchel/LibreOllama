# Phase 1: Stabilization & Test-Environment Correction

**Owner:** Auto-Finisher  
**Status:** In Progress  
**Last Updated:** 2025-07-14

---

## 🎯 Objective

Establish a clean, reliable test suite as the baseline for all future development.

### 📚 Primary References

- [`docs/IMPLEMENTATION_GUIDE.md`](../docs/IMPLEMENTATION_GUIDE.md) – Architecture, patterns, and testing strategy  
- [`docs/COMPLETE_DESIGN_SYSTEM.md`](../docs/COMPLETE_DESIGN_SYSTEM.md) – UI/UX and component standards  
- [`docs/roadmap/`](../docs/roadmap/) – Detailed MVP feature definitions

---

## 🔒 Global Guardrails

- **Git restrictions** – Do **not** stage, commit, or push any changes without explicit approval. All work must remain local.  
- **Logging** – For each completed task, append a timestamped entry to `progress/phase-1-<YYYY-MM-DD>.md` with a summary of actions taken.  
- **Phase completion signal** – When all success criteria are met, log `PHASE-1 COMPLETE` in the progress file and pause for review.  
- **Web search fallback** – If you encounter an unknown error or test failure and cannot resolve it from local context, use the `Search` tool to find documentation or solutions. Summarize findings before applying fixes.  
  - Prioritize results from:
    - `vitejs.dev`
    - `testing-library.com`
    - `tauri.app`
    - `npmjs.com`
    - `stackoverflow.com`
    - `github.com` issues/discussions  
- **Learn from passing tests** – Examine passing tests to understand correct mocks, setup, and test-layer structure. Use them as reference models.  
- **Test-driven reinforcement** – Apply patterns and insights from working test cases to improve production code structure, mocks, and service layers when relevant. Tests are not isolated—they should reinforce and align with production behavior.  
- **Follow testing strategy** – Thoroughly review the [`Implementation Guide`](../docs/IMPLEMENTATION_GUIDE.md) before changing any test logic.  
- **Avoid redundancy** – Reuse existing helpers, services, and patterns. Do not reimplement logic already present.  
- **Codebase hygiene** – Archive outdated, unused, or legacy code to the appropriate docs/_archive/ directory. Keep all active code organized, lean, and professional. Maintain consistent structure and eliminate clutter as part of every task.
- **No silent suppression** – Do not disable TypeScript, ESLint, or testing rules (e.g., // @ts-ignore, eslint-disable, test.skip) unless explicitly approved and logged with justification.
- **Comment discipline** – Write clear, minimal, purposeful comments. Avoid redundant, outdated, or misleading comments. Always update or remove comments when logic changes.
- **Consistent naming and structure** – Follow project naming conventions across files, variables, and functions. Structure all new code to align with existing folder/module patterns.
- **Test-driven mindset** – Where practical, add or update tests before implementing logic changes. Never introduce or modify production logic without validating it through tests.
- **No stale TODOs** – Remove stale TODO: and FIXME: comments. If a TODO is valid, log it in progress/BLOCKERS.md or as a Phase 3 refactor candidate.
- **Single-responsibility principle** – Avoid feature bloat. Do not combine unrelated fixes, features, or refactors in a single task. Keep changes atomic and focused.
- **Use of constants and shared utilities** – Avoid hardcoded values. Prefer central configuration/constants files and shared utility modules wherever possible.
- **Security-First Mindset** – Always sanitize inputs, validate data from external sources, and follow security best practices to prevent common vulnerabilities (like XSS or data injection). Treat security as an integral part of development, not an afterthought.
- **Accessibility (A11y) by Default** – Ensure all UI components are accessible from the start. Use semantic HTML, manage focus, provide ARIA attributes where necessary, and test for keyboard navigability and screen reader compatibility.
- **Robust Error Handling** – Implement graceful error handling for all asynchronous operations, API calls, and potential failure points. Avoid silent failures and provide clear, user-friendly error messages.
- **Prudent Dependency Management** – Carefully evaluate any new third-party dependencies for security, maintenance, and performance impact. Prefer well-supported libraries and avoid adding dependencies for trivial tasks that can be handled with native code.
- **Roadmap authority** – This document defines your task list. Do not invent, reprioritize, or abandon work.  
- **Escalation protocol** – If blocked, log the issue in `progress/BLOCKERS.md`, then continue with the next available task.

---

## 🚧 Phase 1 Tasks

**Goal:** Achieve full test stability and a clean baseline for development.

🚫 Do **not** skip or defer harder tasks in favor of easier ones. Follow this list sequentially unless a task is explicitly blocked.

### ✅ Task List

- **[ ] Fix core test infrastructure**
  - Install `canvas`
  - Mock `konva` in `src/tests/setup.ts`
  - Fix `window.matchMedia` mock  
  ✅ *Done when: All previously broken test suites pass.*

- **[ ] Remove obsolete Notes tests**
  - Delete `docs/_archive/notes_legacy`  
  ✅ *Done when: No legacy test files remain.*

- **[ ] Resolve component-level test failures**
  - `ErrorDisplay.tsx` – Remove duplicate import  
  - `MailContextSidebar.tsx` – Merge duplicate `className`  
  - `ChatInput.tsx` – Guard against `undefined.trim`  
  - `ConversationList.tsx` – Guard against `undefined.toLowerCase`  
  ✅ *Done when: All tests for these components pass without warnings.*

- **[ ] Correct mocking for Tauri and history state**
  - Refactor mocks per “Service Layer Testing” pattern  
  ✅ *Done when: Tests use production-aligned mocks and pass cleanly.*

- **[ ] Run full lint and type checks**
  - `npm run lint -- --max-warnings=0`  
  - `npm run type-check`  
  ✅ *Done when: Both commands return zero errors.*

---

## 🏁 Success Criteria

- All test suites pass (unit, integration, component)  
- `npm run lint` and `npm run type-check` return clean results  
- Progress log updated with `PHASE-1 COMPLETE` and reviewed for accuracy

---

## 📝 Logging Template

Append to `progress/phase-1-<YYYY-MM-DD>.md` for each completed task:

```
## \[TIMESTAMP] Task: \[Task Name]

**Actions Taken:**

* \[List specific actions]

**Files Modified:**

* \[List modified files]

**Result:**

* \[Success/Failure]
* \[Any issues encountered]
* \[Next steps if applicable]

**Reference:**

* \[Passing tests consulted, if any]
* \[External links or documentation, if used]
```

---

**Next Phase:** [Phase 2 – Critical Feature Integration (MVP Completion)](./phase-2-mvp-completion.md)
