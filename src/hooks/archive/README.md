# Archived Hooks

This directory contains React hooks that are no longer used in the current LibreOllama implementation but are preserved for reference.

## Contents

### `use-whiteboard.ts`
Previous implementation of the whiteboard hook. The current whiteboard functionality has been redesigned and is now implemented in `use-whiteboard-fixed.ts` and `use-whiteboard-templates.ts` in the parent directory.

## Why These Are Archived

These hooks were replaced during the project's evolution from:
- **Early prototypes** → **Production-ready hooks**
- **Basic functionality** → **ADHD-optimized implementations**
- **Next.js architecture** → **Tauri desktop application**

## Current Implementation

For current hooks, see:
- `../use-whiteboard-fixed.ts` - Current whiteboard hook with performance improvements
- `../use-whiteboard-templates.ts` - Template functionality for the whiteboard
- `../` - Other active hooks

## Usage

These archived hooks should **not** be imported or used in the current application. They are kept for:
1. **Reference** - Understanding previous implementation approaches
2. **Code archaeology** - Tracking feature evolution
3. **Learning** - Studying different design patterns used

If you need to reference old functionality, consult these files but implement new solutions using the current architecture and design patterns.