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
- **Testing infrastructure complete** (Vitest + Playwright + GitHub Actions CI/CD)
- **Database management UI** implemented (admin dashboard with reset/seed buttons)
- **Complete seed script** with 101 resume items (Site Settings + Resume Profile + 9 Experiences + 25 Projects + 1 Education + 65 Certifications)
- **Google Docs export** working with OAuth2 authentication (uses personal Drive quota)
- **AI generation workflow** complete with job ads, companies, and tailored resume/cover letter generation
- **Environment variables** properly configured for OAuth2 and all services

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

- **Google Docs export**
  - **OAuth2 authentication** (uses personal Google Drive quota, works in local Docker)
    - User-based authentication with automatic redirect from export button
    - Files created in user's Drive folder with proper ownership
    - Status: Completed (OAuth2 flow implemented, auto-authorization working)
  - Alternative: **Service account** (requires domain-wide delegation for production)

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
  - Google Docs credentials (OAuth2):
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `GOOGLE_REDIRECT_URI`
    - `GOOGLE_DRIVE_FOLDER_ID`

Status: Completed

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
  - Added copy-to-clipboard buttons on Generation edit view:
    - Resume Draft: copy as plain text or markdown.
    - Application Letter: copy as plain text.
  - Application letter generation is cleaned to avoid a leading `Header:` label.

- **Admin UX: Generations company field**
  - Added `company` relationship field (read-only) that auto-syncs from `jobAd.company`.
  - Enforced non-updatable at field level (`access.update: () => false`) and admin readOnly.
  - Added `beforeChange` hook to sync company on create/update and `afterRead` hook for legacy docs.
  - Added admin-only backfill endpoint `/next/backfill-generations-company` to populate existing records.
  - Company now displays correctly in Generations list and edit views (same pattern as Job Ads).

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

## Phase 4B — Freelancing landing pages + pricing packages (SEO-first)

Goal: Public pages optimized for inbound freelancing leads where clients can hire you for a day, a week, or a month.

- Public routes (suggested):
  - `/hire` or `/freelance`
    - Primary landing page with packages, positioning, and contact CTA.
  - `/pricing`
    - Simple, scannable pricing table (Day / Week / Month) + what’s included.
  - Optional supporting pages (later):
    - `/services` (service menu)
    - `/case-studies` (selected projects)
    - `/testimonials` (if you collect them)

- CMS model (best practice):
  - Add a new Global: `freelanceSettings`
    - `currency` (default: USD)
    - `monthlyRate` (this is the only required input)
    - `assumptions` (configurable but with sane defaults):
      - `workingDaysPerMonth` (default: 20)
      - `hoursPerDay` (default: 8)
      - `weeksPerMonth` (default: 4)
    - `pricingMultipliers` (configurable):
      - `weeklyMarkupPct` (default: 15%)
      - `dailyMarkupPct` (default: 35%)
    - `rounding`
      - `monthlyIncrement` (default: 100)
      - `weeklyIncrement` (default: 50 or 100)
      - `dailyIncrement` (default: 10)
    - Optional copy fields for the page:
      - `headline`, `subheadline`, `ctaLabel`, `ctaUrl`, `packageNotes`

- Pricing computation (ideal + predictable):
  - Define the monthly package as the “best value” anchor (lowest effective rate).
  - Derive weekly and daily from the monthly anchor (higher effective rate = worse value):
    - `weeklyBase = monthlyRate / weeksPerMonth`
    - `dailyBase = monthlyRate / workingDaysPerMonth`
    - `weeklyRate = roundToIncrement(weeklyBase * (1 + weeklyMarkupPct), weeklyIncrement)`
    - `dailyRate = roundToIncrement(dailyBase * (1 + dailyMarkupPct), dailyIncrement)`
    - `monthlyRateDisplayed = roundToIncrement(monthlyRate, monthlyIncrement)`
  - Display “savings” as a comparison vs the higher-frequency packages:
    - Compare `monthlyRateDisplayed` vs `weeklyRate * weeksPerMonth` and `dailyRate * workingDaysPerMonth`.

- Example (to validate the model):
  - Input `monthlyRate = $1,000`, defaults: 4 weeks, 20 days, weekly +15%, daily +35%
  - `weeklyBase = 250` -> `weeklyRate ≈ 287.5` -> rounded to `$300`
  - `dailyBase = 50` -> `dailyRate ≈ 67.5` -> rounded to `$70`
  - Effective month equivalents:
    - Weekly: `$300 * 4 = $1,200`
    - Daily: `$70 * 20 = $1,400`
  - This makes monthly the “best package”, daily the “worst value” (as intended).

- Rounding best practice:
  - Use a deterministic rounding helper (nearest increment) and keep increments configurable per package.
  - Prefer larger increments for larger packages (e.g. monthly to nearest 100) to avoid odd pricing.

- SEO + AI content generation (best practice, avoid spam):
  - Keep pages grounded in the resume database:
    - Services offered should map to real skills/experience/projects in Payload.
    - Case studies should map to real projects.
  - Use AI only to draft copy and structure—not to invent claims:
    - Generate page outlines, FAQs, and meta descriptions from known facts.
    - Require human review before publishing.
  - Prefer “helpful content” patterns:
    - Clear package descriptions, deliverables, boundaries, and response times.
    - Add FAQs that address buying intent (scope, tools, timezone, handoff, NDA).
  - Add structured data:
    - `Person` (your profile)
    - `Service` + `Offer` for packages (day/week/month)

Status: Planned

## Phase 4C — Packages + booking system + payments (freelance job flow)

Goal: Let a client choose a package, pick from your admin-managed availability, pay via Stripe, and only then confirm the booking and start work.

- **Availability-based gating (hide/disable when you’re busy)**
  - Goal: If you’re fully booked for the relevant time window (day/week/month), don’t send users into a dead booking flow.
  - Global: `bookingSettings`
    - `intakeOpen` (boolean)
    - `closedMessage` (rich text) (e.g. “Not available this week. Next availability: Feb 20.”)
    - `mode` (`auto | manual`)
      - `manual`: `intakeOpen` controls the site
      - `auto`: system calculates availability from schedules + existing confirmed bookings
    - `autoRules` (optional)
      - `closeWhenNoSlotsInNextDays` (default: 7)
      - `closeMonthlyWhenNoCapacityThisMonth` (boolean)
      - `closeWeeklyWhenNoCapacityThisWeek` (boolean)
      - `closeDailyWhenNoCapacityToday` (boolean)
    - `publicFallbackAction`
      - `showInquiryForm` (boolean)
      - `waitlistEnabled` (boolean)
  - Public UX (best practice):
    - `/pricing` still loads, but packages show as:
      - “Available” (normal)
      - “Not available” (disabled CTA) + small explanation
    - `/book` should hard-block when intake is closed:
      - show `closedMessage`
      - offer “Join waitlist / Contact” instead of schedule picker
    - Avoid hiding the entire page with a 404. Prefer a friendly message to reduce confusion and preserve SEO value.
  - Package-level gating (recommended):
    - For each package, compute availability for its relevant window:
      - `day` package: at least 1 slot in the next N days
      - `week` package: at least 1 start slot that can fit a week engagement
      - `month` package: capacity remaining for the current/next month
    - Expose a minimal public API/view model: `package.availabilityStatus` + `nextAvailableAt`.
  - SEO consideration:
    - Keep `/pricing` indexable even when closed.
    - Optionally set `noindex` only if the page becomes low-value (e.g. permanently closed), otherwise keep it accessible.
    - Add FAQ content for “When are you available?” and “How waitlist works”.

- **Core funnel (public UX)**
  - `/hire` or `/pricing`
    - Choose package
    - CTA: “Book a call / Book a start date”
  - `/book`
    - Login / create customer profile
    - Select a schedule slot (based on availability configured in Payload admin)
    - Confirm booking details + terms
    - Pay (Stripe)
    - Receive confirmation + receipt + next steps

- **Package system (CMS model)**
  - Collection: `packages`
    - `name` (e.g. Day / Week / Month / Consultation)
    - `slug`
    - `shortDescription` (1–2 lines)
    - `description` (rich text)
    - `price` (minor unit integer + currency) OR a `stripePriceId` (recommended)
    - `currency` (default from `freelanceSettings`)
    - `durationType` (`call | day | week | month | custom`)
    - `durationMinutes` (for calls)
    - `deliverables` (array)
    - `limits` (e.g. revisions, response time, max meetings)
    - `requiresScheduling` (boolean)
    - `active` (boolean)
    - `sortOrder`
  - Best practice: prefer **Stripe Products/Prices** as the source of truth for amounts/taxes, store `stripeProductId`/`stripePriceId` in Payload.

- **Availability / schedules (admin-managed)**
  - Collection: `availabilityRules` (recommended) + derived “time slots”
    - `timezone` (IANA, e.g. `Asia/Manila`)
    - recurring rules:
      - `daysOfWeek`
      - `startTime`/`endTime`
      - `slotDurationMinutes`
      - `bufferMinutes`
    - one-off overrides:
      - blocked dates, holidays, personal time off
    - optional: per-package restrictions (which packages can be booked in which windows)
  - Alternative (simpler v1): Collection `timeSlots`
    - explicit `startAt` / `endAt` UTC timestamps
    - `capacity` (usually 1)
    - `active`

- **Booking system (CMS model + lifecycle)**
  - Collection: `customers`
    - `email` (unique)
    - `name`
    - `phone` (optional)
    - `timezone` (for display)
    - `providers` (hasMany): `provider` + `providerAccountId`
    - `marketingConsent` (boolean)
  - Collection: `bookings`
    - `customer` (relationship)
    - `package` (relationship)
    - `status`
      - `draft` (not ready)
      - `pending_payment` (slot held, waiting payment)
      - `confirmed` (paid)
      - `cancelled` (by customer/admin)
      - `expired` (payment not completed in time)
      - `refunded` (if applicable)
    - `startAt` / `endAt` (store UTC)
    - `timezoneAtBooking` (IANA string)
    - `notes` (customer notes)
    - `termsAcceptedAt`
    - `stripeCheckoutSessionId` / `stripePaymentIntentId`
    - `paidAt`
    - `amount` + `currency` (snapshot)
  - Critical best practice: implement a **slot hold** to prevent double booking.
    - When user selects a slot, create booking `pending_payment` and mark slot as “held” for e.g. 10–20 minutes.
    - If Stripe payment not completed, expire the booking + release the slot.

- **Authentication (Google / LinkedIn / Facebook)**
  - Recommendation: implement OAuth via **Auth.js (NextAuth)** and map users to `customers`.
  - Store only what you need:
    - email, name, provider + providerAccountId
    - avoid storing access tokens unless you need to call provider APIs
    - if you must store tokens, encrypt at rest and rotate keys
  - Account linking:
    - if a customer logs in with a different provider that has the same verified email, link to the same `customers` record.
  - Compliance:
    - add Privacy Policy + Terms
    - explicit consent for marketing emails

- **Payments (Stripe, pay-first workflow)**
  - Use **Stripe Checkout** (fastest + safest) or Payment Intents (more custom UI).
  - Flow:
    - Create `booking` (pending_payment)
    - Create Stripe Checkout Session referencing the booking ID in `metadata`
    - Redirect to Stripe
    - Confirm via **Stripe webhook** (authoritative)
    - On webhook success:
      - mark booking `confirmed`
      - set `paidAt`
      - email confirmations
  - Important:
    - never trust “success” redirect alone
    - always validate webhook signature

- **Payment methods reality check (global + Philippines)**
  - Stripe reliably supports **credit + debit cards** globally (Visa/Mastercard debit typically works).
  - For **GCash / Maya (PayMaya)** support:
    - availability depends on Stripe account country + supported local payment methods.
    - if you specifically need GCash/Maya and Stripe doesn’t support them for your setup, the best practice is:
      - add a PH payment gateway (e.g. PayMongo / Xendit) as an additional provider, OR
      - accept card payments and document that users can pay using a debit card or a wallet-issued card.
  - Plan decision: define your “supported payment methods” list per deployment environment and render it in `/pricing`.

- **Notifications + ops**
  - Email:
    - booking confirmation
    - receipt (Stripe)
    - reminders (24h + 1h) (optional later)
  - Admin dashboard:
    - bookings list with filters by status/date
    - manual cancel/refund action (admin-only)

- **Security + abuse prevention**
  - Rate limit booking endpoints.
  - CAPTCHA on anonymous flows (optional).
  - Store all timestamps in UTC; display using customer timezone.
  - Access control:
    - public can only read `packages` where `active=true`
    - never expose internal schedule rules if you don’t want competitors scraping; expose only available slots.

Status: Planned

## Phase 5 — Job Ads + AI generation workflow

- Priority: Start here next. Public site + SEO pages can be implemented later.

Status: Completed

- Admin UX: Generations company field
  - Added `company` relationship field (read-only) that auto-syncs from `jobAd.company`.
  - Enforced non-updatable at field level (`access.update: () => false`) and admin readOnly.
  - Added `beforeChange` hook to sync company on create/update and `afterRead` hook for legacy docs.
  - Added admin-only backfill endpoint `/next/backfill-generations-company` to populate existing records.
  - Company now displays correctly in Generations list and edit views (same pattern as Job Ads).

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
    - Generation edit view includes PDF downloads for Resume Draft + Application Letter (implemented with `pdf-lib` to avoid `pdfkit` `Helvetica.afm` runtime ENOENT)
    - Generations create view dropdown improvements:
      - Job Ad relationship labels show `Company – Title` (via `jobAds.displayTitle`).
      - Job Ads and Resume Profiles are sorted by most recently created.
      - Admin-only backfill endpoint available to populate legacy `jobAds.displayTitle`: `POST /next/backfill-jobads-displaytitle`.

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

## Phase 6 — Deployment on Vercel

- Configure:
  - Build command
  - Node version
  - Environment variables
  - Payload admin route

- Connect Neon:
  - confirm SSL requirement and connection pooling strategy

- **Database seeding:**
  - **Best practice: Seed locally or via CI/CD before deployment**
  - Vercel serverless functions have timeout limits (10s Hobby, 60s Pro, 900s Enterprise)
  - Recommended approaches:
    - Seed locally with production DATABASE_URL before deploying
    - Use GitHub Actions to seed on deployment
    - Use admin API endpoint (`/api/seed-resume`) for one-time seeding on Pro/Enterprise plans
  - See `SEEDING.md` for complete guide

- Verify:
  - Payload migrations run correctly
  - Vercel Blob upload works
  - Public site caches/ISR behave correctly

## Phase 7 — Hardening + operational best practices

- Security:
  - CSRF/session settings (Payload)
  - strict access control for private fields
  - request validation

- Observability:
  - server logs + basic error reporting

- Content workflows:
  - `publishedAt` fields
  - preview mode for editors

## Phase 8 — Testing Infrastructure + Database Management

Status: **Completed** (2026-03-03)

### Testing Infrastructure
- **Test Suite**:
  - Vitest for integration tests (seed functions, access control, API endpoints)
  - Playwright for E2E tests (admin login, database manager UI, navigation)
  - 28 total tests across 5 test files
- **Test Database**:
  - Isolated PostgreSQL instance on port 5433
  - Separate `.env.test` configuration
  - Docker Compose test configuration
- **CI/CD**:
  - GitHub Actions workflow (`.github/workflows/test.yml`)
  - Runs on every push/PR to `main` and `develop`
  - 4 jobs: Integration Tests, E2E Tests, Lint, Type Check
  - Automatic Playwright report uploads
- **Developer Tools**:
  - `Makefile` with simple commands (`make test`, `make dev`, `make seed`)
  - Git hooks (pre-commit: lint + type check, pre-push: optional full tests)
  - `TESTING.md` - Complete testing guide
  - `QUICKSTART.md` - Daily workflow documentation
- **npm Scripts**:
  - `test` - Run all tests
  - `test:int` - Integration tests only
  - `test:e2e` - E2E tests only
  - `test:watch` - Watch mode for development
  - `test:db:up` / `test:db:down` - Manage test database

### Database Management UI
- **Admin Dashboard Component** (`src/components/DatabaseManager.tsx`):
  - One-click "Reset & Seed Database" button
  - Individual "Reset Database" and "Seed Database" buttons
  - Confirmation dialogs for destructive actions
  - Real-time feedback with success/error messages
  - Integrated via `beforeDashboard` component
- **API Endpoints**:
  - `POST /api/database/reset` - Admin-only, clears Resume Profile + all collections
  - `POST /api/database/seed` - Admin-only, seeds complete resume data

## Phase 9 — Google Docs Export with OAuth2

Status: **Completed** (2026-03-03)

### Problem Solved
- **Service Account Quota Issue**: Service accounts have 0 storage quota, causing "Drive storage quota exceeded" errors
- **Local Docker Limitation**: Service account approach doesn't work in local Docker without domain-wide delegation
- **CI/CD Database Issue**: Missing database schema initialization causing "relation 'users' does not exist" errors

### OAuth2 Implementation
- **Authentication Flow**:
  - User-based OAuth2 authentication (same as Laravel system)
  - Uses personal Google Drive quota instead of service account
  - Automatic redirect from export button to authorization
  - Token storage in `.google-token.json` with auto-refresh
- **API Endpoints**:
  - `GET /api/google/authorize` - Redirect to Google consent screen
  - `GET /api/google/callback` - Handle OAuth response
  - `GET /api/google/status` - Check authentication status
  - `POST /api/google/logout` - Clear stored tokens
- **Frontend Integration**:
  - Auto-redirect when not authenticated
  - Seamless user experience with toast notifications
  - Files created directly in user's Drive folder

### Technical Details
- **OAuth2 Scopes**: `drive.file`, `documents` (minimal permissions)
- **Token Management**: Local file storage with automatic refresh
- **Error Handling**: Graceful fallbacks and clear user messages
- **Security**: `.google-token.json` in `.gitignore`, no sensitive data in code

### CI/CD Fix
- **Database Initialization**: Created `scripts/init-db.ts` to initialize Payload schema
- **GitHub Actions**: Replaced `pnpm payload migrate` with `pnpm run init:db`
- **Environment Variables**: Proper test database configuration

### Documentation
- **Setup Guide**: `docs/GOOGLE_OAUTH_SETUP.md` with complete instructions
- **API Reference**: All endpoints documented with examples
- **Troubleshooting**: Common issues and solutions
- **Security Notes**: Best practices for OAuth2 implementation

### Files Created/Modified
- **New Files**: `src/utilities/google-oauth.ts`, OAuth2 API routes, `scripts/init-db.ts`
- **Modified**: `src/utilities/google-docs.ts` (OAuth2 integration), export route, frontend component
- **Documentation**: Complete OAuth2 setup guide and API reference

### Best Practices Implemented
- **3-layer testing safety net**:
  1. Local testing with simple `make test` command
  2. Git hooks for automatic pre-commit checks
  3. GitHub Actions CI/CD for every push/PR
- **Isolated test environment** to avoid affecting development data
- **Comprehensive documentation** for testing workflows
- **Developer-friendly commands** via Makefile for easy adoption
