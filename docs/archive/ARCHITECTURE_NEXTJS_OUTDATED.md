# LibreOllama Architecture (2025+)

## Key Principles
- **Node.js Runtime First**: All authentication and database operations are designed for Node.js runtime, not Edge Runtime.
- **Simplicity & Maintainability**: No runtime detection or dynamic imports for database/auth logic. One clear code path.
- **Self-Hosted, Local-First**: Optimized for local SQLite and on-prem LLMs.

## Why This Architecture?

### Background
- Next.js 15+ supports Node.js runtime for middleware and API routes.
- Edge Runtime is not suitable for local-first apps using SQLite or large AI dependencies.
- Previous approaches (runtime detection, dynamic imports, Edge-safe wrappers) are now obsolete and add unnecessary complexity.

### Best Practices (from Perplexity Deep Research)
- Use `export const config = { runtime: 'nodejs' }` in middleware and API routes that need Node.js APIs.
- Use a single authentication module with direct database access.
- Remove all runtime detection and Edge-safe wrappers for database/auth.
- Keep middleware logic minimal and focused on authentication/session validation.

## Authentication & Database
- All authentication (JWT, session, user lookup) is handled in a single `local-auth.ts` module.
- Database access is direct via Drizzle ORM and `better-sqlite3`.
- No code paths for Edge Runtime or browser for database/auth logic.

## Migration Notes
- If you previously used `connection-safe.ts`, `local-auth-edge.ts`, or runtime detection, you can delete those files.
- All API routes and middleware should import from `local-auth.ts` and use direct database access.

## Example Middleware
```ts
import { getCurrentUser } from '@/lib/auth/local-auth';
export const config = { runtime: 'nodejs' };
export async function middleware(request) {
  const user = await getCurrentUser(request);
  // ...
}
```

## Benefits
- **Performance**: No dynamic imports or runtime checks.
- **Reliability**: No accidental Edge Runtime code paths.
- **Maintainability**: Fewer files, less indirection, easier onboarding.
- **Security**: All sensitive logic stays server-side.

---

_This architecture is based on deep research into Next.js 15+ best practices and the needs of local-first, self-hosted AI applications._
