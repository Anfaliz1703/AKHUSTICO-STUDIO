# AKHUSTICO Studio Agent Instructions

- Work in the existing monorepo only; do not scaffold a parallel project.
- Preserve existing Next.js App Router, pnpm workspace, auth, library, reader, transposition, import/export, jobs API, and music-core behavior unless a verified bug requires a scoped fix.
- Treat `ProcessingJobRepository` as the source of truth for processing jobs. Providers may execute processing, but must persist stage/progress/result changes through the repository.
- Demo mode must use a shared in-memory store, never independent module-local `new Map()` instances for durable app state.
- Without `DATABASE_URL`, run in explicit demo/in-memory mode. With `DATABASE_URL`, use PostgreSQL and fail loudly if the connection fails.
- Do not store audio files in the web filesystem as persistence; use Blob metadata in the database and Vercel Blob for real audio storage.
- Manual song corrections have priority over imported values, and imported values have priority over AI-generated values.
- Keep UI controls honest: visible buttons must either work or be disabled with a clear reason.
- Before finalizing, run the available typecheck, tests, and builds, and report any external credentials still required.
