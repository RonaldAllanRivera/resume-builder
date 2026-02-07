# Resume CMS + Portfolio (Next.js + Payload) Plan

This plan scaffolds a single-repo Next.js app with embedded Payload CMS, deployed on Vercel with Neon Postgres, Vercel Blob storage, multi-user auth, SEO-first public pages, and an AI workflow that generates tailored resume/application content and exports it to Google Docs.

## Current status

- Repo scaffolded from Payload Website Template (Payload 3.74.0 / Next.js 15)
- Local Postgres running via Docker
- App running locally:
  - `http://localhost:3000` (frontend)
  - `http://localhost:3000/admin` (Payload admin)
- Resume/portfolio CMS data model implemented (collections + globals + minimal RBAC)
- Projects admin create/edit working (uses a plain `slug` text field with automatic generation from `title`)

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
    - Status: Completed (Drive folder shared + env vars populated)
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

Status: Completed

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
  - `NEXT_PUBLIC_SERVER_URL`
  - `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
  - `OPENAI_API_KEY`
  - Google Docs credentials (service account default):
    - `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
    - `GOOGLE_DRIVE_FOLDER_ID`

Status: In progress

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

Status: Completed

- **Access control (minimal roles)**
  - **admin**: full access
  - **editor**: can CRUD resume/portfolio content; cannot manage users/roles
  - Public read access only for “published” fields/docs

- **Admin UX: Delete versions**
  - Added “Delete versions…” in the 3‑dot edit menu for admins on all versioned collections.
  - Deletes all stored versions for the current document only; safe and admin‑only.
  - Backed by a secure `/next/delete-versions` endpoint.

- **Admin UX: Resume seeding**
  - Added an admin-only dashboard action to seed resume data from `resume.txt`.
  - Includes a CLI script for reliable seeding outside HTTP.
  - Backed by a secure `/next/seed-resume` endpoint.

- **Admin UX: Generations copy buttons**
  - Added copy-to-clipboard buttons on the Generation edit view:
    - Resume Draft: copy as plain text or markdown.
    - Application Letter: copy as plain text.
  - Application letter generation is cleaned to avoid a leading `Header:` label.

## Phase 4 — Public site pages (SEO-first)

- Build public routes (App Router):
  - `/` Home/overview (summary + featured projects)
  - `/experience` Experience timeline/list
  - `/education` Education history
  - `/projects` Project grid/list
  - `/projects/[slug]` Project detail
  - `/certifications` Certifications (grid + rail + modal)
  - Optional later:
    - `/about`
    - `/contact`
    - `/resume.pdf`

- Template system (best-practice for extensibility):
  - Choose template via a public setting (e.g. `siteSettings.publicTemplate`) with a safe allowlist.
  - Support preview override via query param (e.g. `?template=modern`) without changing persisted settings.
  - Implement templates via a registry (map template key -> layout/components) so adding a new template is a file-only change.
  - Keep core data fetching shared; templates should only change presentation.

- Data fetching (public pages):
  - Prefer Server Components for page shells.
  - Read data via Payload Local API on the server.
  - Enforce access control for public reads (`overrideAccess: false`) and query only published docs.
  - Use stable sorting for timelines and rails (e.g. `-publishedAt`, `-startDate`).
  - Add a lightweight “view model” layer (formatting dates, building absolute media URLs) so templates stay dumb.

- Navigation/UI:
  - Server-rendered navigation, with accessible section highlighting (`aria-current="page"`).
  - Dynamic sections pulled from settings (e.g. show/hide Education, Certifications).

- External project links (privacy + safety):
  - For outbound links (repo URL / live URL), render anchors with:
    - `rel="nofollow noopener noreferrer"`
    - `referrerPolicy="no-referrer"`
    - `target="_blank"` (optional; recommended if you want to keep visitors on your site)
  - Note: this prevents sending a `Referer` header and avoids `window.opener` attacks, but the destination can still see the visitor’s IP and user agent.
  - Optional hardening:
    - Set a global `Referrer-Policy: no-referrer` header at the Next.js app level (still keep per-link attributes for clarity).

- SEO requirements:
  - Use `generateMetadata` per route
  - `sitemap.xml` generated from Payload content
  - `robots.txt`
  - OpenGraph + Twitter card metadata on all public pages
  - JSON-LD structured data (entity-first):
    - `Person` for profile (include `sameAs` links)
    - `WebSite` + `WebPage`
    - Projects: `SoftwareApplication` when applicable (fallback to `CreativeWork`)
  - Canonicals + clean slugs
  - Prefer static rendering/ISR for speed
  - Internal linking (build a “topic graph”):
    - Link experiences to related projects/skills
    - Link projects to related certifications/skills
  - Content formatting for extraction:
    - Clear headings, short summaries near the top of each page
    - Prefer structured lists for skills/tech stacks
  - (Optional) Add `llms.txt` that points to the most important pages for AI crawlers

- Certifications UI (best-practice UX + a11y):
  - “Netflix-style” horizontal rail with arrow controls and keyboard support.
  - Responsive toggle: rail view vs grid view.
  - Modal detail view implemented as a route-friendly pattern:
    - Prefer App Router intercepting/parallel routes so modals are deep-linkable.
  - Deterministic gradients/icons per certification (derived from a stable hash of the cert ID/title).

- Animated background (optional, progressive enhancement):
  - Render at layout level so it persists across navigation.
  - Honor `prefers-reduced-motion` and provide an easy disable toggle.

- Design system:
  - Dark, liquid-responsive layout with high contrast and strong typography.
  - Brand colors via CSS variables sourced from `siteSettings` with sensible defaults.
  - Tailwind (or similar) is fine, but keep token values centralized (CSS vars -> Tailwind config).

## Phase 5 — Job Ads + AI generation workflow

- Priority: Start here next. Public site + SEO pages can be implemented later.

Status: In progress (core generation workflow implemented; export + additional admin actions pending)

- Requirements (admin-first workflow):
  - Create and manage job ads and company info in the Payload admin.
  - Support multiple resume “profiles” (e.g. Full-Stack, AI Systems, Laravel) and select one per generation attempt.
  - Support multiple attempts per job ad (store each attempt as its own generation record).
  - OpenAI only (for v1).
  - In admin, review/edit:
    - tailored resume
    - application letter / cover letter
    - before exporting to Google Docs.
  - Cover letter composition settings:
    - Recipient name / greeting (e.g. “Hi Mike,”)
    - Header (optional)
    - Footer/signature block (multi-line) with a dynamic “Resume:” link that uses the exported Google Docs URL.

- Implemented (current):
  - Collections + globals for Phase 5:
    - Collections: `companies`, `jobAds`, `resumeProfiles`, `generations`
    - Globals: `aiGenerationSettings`, `coverLetterSettings`
  - Prompt templates + model defaults managed in CMS:
    - `promptVersion`, `model`, `temperature`, `systemPrompt`, `resumePrompt`, `experienceRewritePrompt`, `coverLetterStyle`, `coverLetterPrompt`
  - Generation pipeline (server-side):
    - Admin/editor-only `POST /next/generate-drafts`
    - Builds structured `resumeFacts` from database collections
    - Runs a selection step (JSON) to pick job-relevant experiences/projects/certs/education by ID
    - Generates `resumeDraft` (ATS-friendly) + `applicationLetter`
    - Stores run metadata (`promptVersion`, `model`, `temperature`, `inputHash`) on the Generation record
    - Pre-formats current and past experiences server-side into shortcodes to reduce hallucinations and enforce layout:
      - Current experience blocks: `{{professionalExperienceBlocks}}`
      - Past experience one-liners: `{{earlierExperienceLines}}`
    - Adds an AI rewrite step for CURRENT experiences (optional) to tailor role title + highlight bullets to the job ad (still factual):
      - Output shortcodes: `{{professionalExperienceBlocksCustomized}}`, `{{professionalExperience1BlockCustomized}}`, `{{professionalExperience1TitleCustomized}}`, `{{professionalExperience1HighlightsCustomized}}` (and `2*` variants)
  - Admin UX / documentation:
    - `Globals → AI Generation Settings` includes collapsible (hidden by default) help:
      - Shortcode reference (one shortcode per line)
      - Explanations for `promptVersion`, `model`, `temperature` (allowed values + cost guidance)
    - Note: after adding/changing admin components, run `npm run generate:importmap`
    - Default resume output formatting tuned for a shorter resume:
      - Uses `{{professionalExperienceBlocksCustomized}}` by default
      - Core Skills rendered as a single comma-separated line
    - Generation edit view includes copy buttons for quick exporting (plain text / markdown)

- CMS data model (suggested):
  - `resumeProfiles`
    - A structured, canonical resume source (per profile) used as the only facts the generator may reference.
  - `companies`
    - company notes (tone, values, about) to guide the cover letter.
  - `jobAds`
    - relationship to `companies`
    - job poster name (e.g. recruiter / hiring manager) for the greeting
    - job description (raw)
  - `generations` (hasMany under a `jobAd`)
    - relationship to `jobAds`
    - relationship to `resumeProfiles`
    - status (`draft | generating | ready_for_review | approved | exported | failed`)
    - gap analysis output
    - tailored resume draft
    - cover letter draft
    - prompt version + model metadata + temperature
    - input hash (resume profile snapshot + job ad) to detect duplicates
    - google doc IDs/URLs after export

- Prompting + output best practices:
  - Structured outputs for all steps (validated schema), not free-form text.
  - Hard “no hallucinations” rule:
    - Only use facts present in the selected resume profile + the job ad + company notes.
    - If missing, omit or mark as unknown.
  - Prefer a 3-step pipeline:
    - Extract requirements/keywords (structured)
    - Generate tailored resume draft
    - Generate cover letter draft (tone-aware)
  - Store prompt versioning and run metadata with each attempt for reproducibility.

- Admin actions (buttons) + security:
  - Admin/editor-only “Generate attempt” button on a job ad (creates a new generation record).
  - Admin/editor-only “Regenerate” button on a generation (creates a new attempt).
  - Admin/editor-only “Export to Google Docs” button on a generation.
  - Export should use the reviewed/edited CMS fields, not raw model output.

- Google Docs export (service account):
  - Create:
    - Resume doc
    - Cover letter doc
  - Store exported URLs on the generation.
  - After creating the resume doc, inject the resume URL into the cover letter footer block (dynamic “Resume:” line).

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

Status: Later

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

Status: Later

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
