# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript app (features, components, stores, tests). Key areas: `src/features/canvas`, `src/components/ui`, `src/stores`, `src/tests`.
- `src-tauri/`: Tauri (Rust) desktop shell, config, and DB migrations.
- `public/` and `assets/`: static assets and icons. `docs/`: project docs. `cypress/`: e2e specs.
- Tests live under `src/features/**/tests` and `src/tests`; story previews in `src/stories`.

## Build, Test, and Development Commands
- `npm run dev`: Vite dev server for the web app.
- `npm run tauri:dev`: Run desktop app (Tauri) with the dev server.
- `npm run build`: Type-checks and builds to `dist/`.
- `npm run tauri:build`: Produce desktop bundles.
- `npm test` / `npm run test:watch`: Run Vitest once / in watch mode.
- `npm run test:coverage`: Generate coverage report.
- `npm run lint` / `npm run lint:fix`: Lint TypeScript (and fix auto-fixable issues).
- `npm run type-check`: TS type checking without emit.
- `npm run ladle`: Run component/story previews.

## Coding Style & Naming Conventions
- TypeScript, React 19, Tailwind. Two-space indentation.
- Components: PascalCase (e.g., `SyncStatus.tsx`). Hooks: `useX` (e.g., `useCanvasStore`).
- Directories and non-component files: kebab-case or domain folders (e.g., `features/canvas`).
- Keep modules small and colocate feature code under `src/features/<domain>`.
- Linting via ESLint (+ React/Tailwind plugins) and Stylelint; run `lint` before PRs.

## Testing Guidelines
- Unit/integration tests: Vitest + Testing Library (happy-dom/jsdom). Name as `*.test.ts(x)`.
- Place tests next to the feature (`src/features/<domain>/tests`) or in `src/tests`.
- Cover new logic and edge cases; prefer deterministic tests. Run `npm test` locally and ensure coverage doesn’t regress (`npm run test:coverage`).

## Commit & Pull Request Guidelines
- Commits: clear, imperative subject (max ~72 chars). Prefer Conventional Commit prefixes when practical (feat, fix, refactor, test, docs).
- PRs: small, focused; include description, linked issues, and screenshots for UI changes. Note breaking changes explicitly.
- Pre-submit: `npm run lint && npm test && npm run type-check`. Follow the PR template in `.github/pull_request_template.md`.

## Security & Configuration Tips
- Do not commit secrets. Local env lives in `src-tauri/.env` (gitignored).
- Tauri CSP restricts network access; the app connects to `localhost:11434` and Google APIs—avoid hardcoding URLs.
- Database migrations live in `src-tauri/migrations/`; update responsibly with forward-only changes.
