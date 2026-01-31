# Resume CMS + Portfolio (Next.js + Payload) Plan

This plan scaffolds a single-repo Next.js app with embedded Payload CMS, deployed on Vercel with Neon Postgres, Vercel Blob storage, multi-user auth, SEO-first public pages, and an AI workflow that generates tailored resume/application content and exports it to Google Docs.

## Phase 0 — Decisions + prerequisites

- **Architecture**
  - Single repo + single Vercel project.
  - Next.js (App Router) serves both:
    - Public portfolio pages
    - Payload Admin UI (e.g. `/admin`) and Payload API (e.g. `/api/...`)

- **Accounts/services**
  - Vercel (free)
  - Neon Postgres
  - Vercel Blob
  - OpenAI API key
  - **Google Docs API** (requires Google Cloud project + credentials)

- **Google Docs export (default)**
  - **Service account** (best for “personal internal tool”, easiest server-to-server)
    - You’ll share a Google Drive folder with the service-account email.
    - All CMS users export into the same shared folder (simplest v1).
  - Future upgrade option: **OAuth (3-legged)** if you want exports to go to each user’s own Drive.

## Phase 1 — Repo scaffold (local dev + Docker)

- Initialize a Next.js project (TypeScript) with App Router.
- Add Payload CMS (v3) embedded into the Next.js app.
- Add Docker support:
  - `Dockerfile` for the app
  - `docker-compose.yml` for local development
  - Local Postgres container for dev (while production uses Neon)
- Add standard quality tooling:
  - ESLint + Prettier
  - Environment variable validation (e.g. `zod` or similar)

## Phase 2 — Environment variables + secrets (best practice)

- **Local**
  - Use `.env.local` (Next.js convention) for developer-specific secrets.
  - Add `.env.example` as a template.
  - Ensure `.env*` (except `.env.example`) is in `.gitignore`.

- **Vercel**
  - Store production secrets in Vercel Project Settings → Environment Variables.
  - Use separate values for Preview/Production.

- **Required env vars (initial)**
  - `DATABASE_URL` (Neon)
  - `PAYLOAD_SECRET`
  - `NEXT_PUBLIC_SITE_URL`
  - `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
  - `OPENAI_API_KEY`
  - Google Docs credentials (service account default):
    - `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
    - `GOOGLE_DRIVE_FOLDER_ID`

## Phase 3 — Payload data model (resume + portfolio)

- **Globals**
  - `siteSettings`
    - site name
    - default SEO title/description
    - social links
  - `resumeProfile`
    - name, headline, summary
    - contact fields
    - **publish toggles** (phone/address/DOB hidden by default)

- **Collections**
  - `users` (Payload auth)
    - minimal roles: `admin`, `editor`
  - `experiences`
  - `educations`
  - `projects`
  - `certifications`
  - `media`
    - backed by Vercel Blob for images/certificates

- **Access control (minimal roles)**
  - **admin**: full access
  - **editor**: can CRUD resume/portfolio content; cannot manage users/roles
  - Public read access only for “published” fields/docs

## Phase 4 — Public site pages (SEO-first)

- Build public routes (App Router):
  - `/` Home (summary + featured projects)
  - `/projects` + `/projects/[slug]`
  - `/experience`
  - `/certifications`

- SEO requirements:
  - Use `generateMetadata` per route
  - `sitemap.xml` generated from Payload content
  - `robots.txt`
  - JSON-LD structured data:
    - `Person` for profile
    - `CreativeWork` for projects
  - Canonicals + clean slugs
  - Prefer static rendering/ISR for speed

## Phase 5 — Job Ads + AI generation workflow

- New collections:
  - `jobAds`
    - title, company name, job url
    - job description (raw)
    - “about the company”
    - status: `new | processing | done | failed`
  - `aiGenerations` (or `applications`)
    - relation to `jobAds`
    - generated resume JSON + markdown
    - cover letter
    - match reasons
    - versioning metadata (prompt version, model)

- AI orchestration:
  - Server-only route/endpoint triggers generation.
  - Rate limiting + audit logging.
  - Prompt versioning stored with output.

## Phase 6 — Google Docs export

- Implement “Export to Google Docs” on an `aiGeneration`:
  - Create a Google Doc with:
    - Title pattern: `{Company} - {Role} - Resume` / `Cover Letter`
    - Insert generated content with headings and formatting
  - Store `googleDocId` and `googleDocUrl` in Payload

- Credential approach (v1):
  - Service account: share a folder; docs created there.
- Future upgrade option:
  - OAuth: docs created under the exporting user’s Drive.

## Phase 7 — Deployment on Vercel

- Configure:
  - Build command
  - Node version
  - Environment variables
  - Payload admin route

- Connect Neon:
  - confirm SSL requirement and connection pooling strategy

- Verify:
  - Payload migrations run correctly
  - Vercel Blob upload works
  - Public site caches/ISR behave correctly

## Phase 8 — Hardening + operational best practices

- Security:
  - CSRF/session settings (Payload)
  - strict access control for private fields
  - request validation

- Observability:
  - server logs + basic error reporting

- Content workflows:
  - `publishedAt` fields
  - preview mode for editors
