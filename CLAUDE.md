# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build (also runs next-sitemap postbuild)
pnpm start                  # Start production server
pnpm lint                   # ESLint check
pnpm lint:fix               # ESLint auto-fix
pnpm exec tsc --noEmit      # TypeScript check (runs in pre-commit hook)

# Payload
pnpm generate:types         # Regenerate payload-types.ts after schema changes
pnpm generate:importmap     # Regenerate import map after adding admin components
pnpm migrate                # Run database migrations
pnpm migrate:status         # Check migration status

# Seeding
pnpm seed:resume            # Seed all resume data (certifications, projects, experience, education)
pnpm seed:complete          # Seed with additional data
pnpm seed:projects          # Seed projects only
pnpm reset:database         # Wipe and reset database

# Testing
pnpm test:db:up             # Start test database (PostgreSQL on port 5433)
pnpm test:db:down           # Stop test database
pnpm test:int               # Run Vitest integration tests
pnpm test:watch             # Vitest watch mode
pnpm test:e2e               # Run Playwright E2E tests
pnpm exec vitest run tests/int/seed.test.ts           # Run a single integration test file
pnpm exec playwright test tests/e2e/admin-login.spec.ts  # Run a single E2E test
```

Integration tests live in `tests/int/**/*.int.spec.ts` and run against the test DB (`.env.test`, port 5433). E2E tests live in `tests/e2e/`.

## Architecture

This is a **Payload CMS 3.x + Next.js 15** personal portfolio/resume site backed by PostgreSQL. Payload is embedded directly into the Next.js app (not a separate service).

### Route Groups

- `src/app/(frontend)/` — public-facing portfolio pages
- `src/app/(payload)/` — Payload admin panel (`/admin`)
- `src/app/api/` — custom REST endpoints (availability, bookings, webhooks/stripe, seed, etc.)

### Payload Collections

Defined in `src/collections/`. Key collections:
- **Resume data**: `Experiences`, `Educations`, `Certifications`, `Projects`, `ResumeProfiles`, `Companies`
- **CMS content**: `Pages`, `Posts`, `Media`, `Categories`
- **Booking system**: `Packages`, `Customers`, `AvailabilityRules`, `Bookings`
- **AI**: `Generations`, `JobAds`

Globals: `Header`, `Footer`, `SiteSettings`, `ResumeProfile`, `CoverLetterSettings`, `AIGenerationSettings`

After modifying collection/global schemas, run `pnpm generate:types` to update `src/payload-types.ts` and `pnpm generate:importmap` after adding new admin components.

### Template System

The public site uses a swappable template system. The active template is set in **Globals → Site Settings → Template** in the Payload admin (no rebuild required). Templates live in `src/templates/`:

- `registry.ts` — maps template keys (`default`, `modern`, `minimal`, `rainbow`) to component implementations
- Each template must implement the `TemplateComponents` interface (Layout, HomePage, ExperiencePage, EducationPage, ProjectsPage, ProjectCategoryPage, CertificationsPage)
- `src/utilities/getTemplate.ts` — reads the active template from SiteSettings and resolves the registry

Frontend pages fetch data server-side and pass it as props to template components. Templates are purely presentational. Data fetching utilities are in `src/utilities/fetchPublicData.ts`.

Preview any template without changing the saved setting: `/?template=rainbow`

### Booking System

A freelance booking platform with Stripe payments. Lifecycle:

```
pending_review → accepted → pending_payment → paid → in_progress → work_completed → payment_released
```

Key files:
- `src/app/api/bookings/route.ts` — booking submission endpoint
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `src/lib/stripe.ts` — Stripe client
- `src/lib/booking-email.ts` — booking email via Resend
- `src/app/(frontend)/book/[packageSlug]/` — booking flow pages

Stripe webhooks must be forwarded locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Access Control

Roles: `admin`, `editor`, `user`. Access control functions live in `src/access/`.

**Critical**: When using the Payload Local API with a `user`, always set `overrideAccess: false`, otherwise access control is bypassed and the operation runs with admin privileges.

**Critical**: In collection hooks, always pass `req` to nested Payload operations so they run in the same transaction.

### Plugins

Configured in `src/plugins/index.ts`: `redirects`, `nestedDocs` (categories), `seo`, `formBuilder`, `search` (posts only).

### Animation System

Uses Framer Motion. Key components: `HeroReveal` (hero section staggered entrance) and `ScrollReveal` (scroll-triggered fade-up). Respects `prefers-reduced-motion`. Only animate `transform` and `opacity` (GPU-accelerated).

## Key Patterns

- **ISR**: Pages use `export const revalidate = 300` (5-minute revalidation)
- **Type safety**: `src/payload-types.ts` is auto-generated — never edit manually
- **Path alias**: `@/` maps to `src/`
- **Pre-commit hook**: runs `pnpm lint` and `tsc --noEmit` automatically

## Environment Variables

See `.env.example` for all required variables. Key groups:
- `DATABASE_URL` — PostgreSQL connection string
- `PAYLOAD_SECRET` — JWT encryption secret
- `OPENAI_API_KEY` — AI generation features
- `RESEND_API_KEY` + `CONTACT_FORM_*` — contact form emails
- `STRIPE_*` — booking payment processing
- `BOOKING_*` — booking configuration (timezone, buffer, advance notice)
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` — Google Docs export feature
