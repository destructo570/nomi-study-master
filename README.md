# nomi

Nomi is an AI study workspace that turns notes, PDFs, articles, videos, and recordings into summaries, flashcards, quizzes, mind maps, podcasts, and source-grounded tutoring.

This repository is a Bun/Turborepo monorepo containing a Next.js web app, a Hono API, shared UI and type packages, and a PostgreSQL schema managed with Drizzle.

## Repository layout

```text
apps/
  backend/       Bun + Hono API, workers, AI and file-processing services
  web/           Next.js App Router application
packages/
  db/            Drizzle schema, migrations, and database client
  types/         Shared domain types and plan limits
  ui/            Shared React components and styles
docs/            Architecture and product notes
```

## Prerequisites

- Bun 1.3.9 or newer
- Node.js 20 or newer
- PostgreSQL
- Redis for background jobs and rate limiting
- Python 3 with `PyMuPDF==1.24.10` for PDF parsing
- Cloudflare R2-compatible object storage for file uploads

AI, authentication, billing, analytics, article extraction, and podcast generation require the corresponding provider credentials described below.

## Local setup

1. Install JavaScript dependencies:

   ```bash
   bun install --frozen-lockfile
   ```

2. Create local environment files from the safe templates:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

3. Set at least `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN`, and `NEXT_PUBLIC_API_BASE_URL`. Generate a long random auth secret; never reuse a production secret locally.

4. Install the PDF parser dependency:

   ```bash
   python3 -m venv apps/backend/.venv
   apps/backend/.venv/bin/pip install -r apps/backend/requirements.txt
   ```

   Then set `PDF_PARSER_PYTHON` in `apps/backend/.env` to the virtual environment's Python executable.

5. Apply the database migrations:

   ```bash
   bun --filter @workspace/db db:migrate
   ```

6. Start the web app and API:

   ```bash
   bun dev
   ```

   The web app defaults to `http://localhost:4004`; the API defaults to `http://localhost:3001`.

For a minimal local environment without Redis-backed workers, set `ENABLE_FILE_WORKER=0`, `ENABLE_EMBED_WORKER=false`, `ENABLE_URL_INGEST_WORKER=0`, and `ENABLE_PODCAST_WORKER=0`.

## Environment variables

The checked-in `.env.example` files contain placeholders only. Important backend settings include:

- Core: `DATABASE_URL`, `PORT`, `WEB_ORIGIN`
- Authentication: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- AI: `OPENAI_API_KEY`, `EMBED_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `KOKORO_MODEL_ID`
- Jobs: `REDIS_URL` and the `ENABLE_*_WORKER` / `*_CONCURRENCY` settings
- Storage: `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Billing: `DODO_ENVIRONMENT`, `DODO_PAYMENTS_API_KEY`, `DODO_WEBHOOK_KEY`, and the `DODO_PRODUCT_*` IDs
- Optional integrations: `FIRECRAWL_API_KEY`, `TRANSCRIPTAPI_KEY`, PostHog, Google Analytics, and Discord webhooks

Only variables prefixed with `NEXT_PUBLIC_` may be exposed to browser code. Do not place secrets in those variables.

## Commands

```bash
bun dev                         # run all development services
bun run build                   # production build
bun run typecheck               # TypeScript checks across workspaces
bun run lint                    # ESLint checks
bun audit                       # dependency vulnerability scan
bun --filter @workspace/db db:studio
```

## Security

- Real `.env` files, private keys, local virtual environments, caches, debug chat dumps, and generated reports are ignored by Git.
- The API uses cookie-based sessions, explicit credentialed-origin checks, admin middleware, ownership checks for user resources, signed billing webhooks, and short-lived signed object-storage URLs.
- Unexpected server errors are logged server-side and returned to clients as generic errors.
- Chat-context dumps are disabled in production and require an explicit development opt-in.

Before every public release, run `bun audit`, `bun run typecheck`, and `bun run build`. See [SECURITY.md](SECURITY.md) for responsible disclosure.

## Deployment notes

- Use HTTPS for both `WEB_ORIGIN` and `BETTER_AUTH_URL` in production.
- Set a unique, high-entropy `BETTER_AUTH_SECRET` and rotate any credential that may previously have been exposed.
- Keep R2 buckets private; serve objects through signed URLs or an intentionally configured public CDN.
- Verify Dodo webhook signatures and product IDs in test mode before enabling live billing.
- Configure database backups, Redis authentication/TLS, log retention, and rate limits at the hosting layer.

## License

No license is currently included. Public visibility does not grant permission to copy, modify, or redistribute the code. Add an explicit license before accepting outside contributions or permitting reuse.
