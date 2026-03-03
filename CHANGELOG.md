# Changelog

## [0.4.0] - 2026-03-03

### Google Docs Export with OAuth2
- **Fixed Service Account Quota Issue**: Replaced service account with OAuth2 user authentication
- **Local Docker Support**: Google Docs export now works in local Docker without domain-wide delegation
- **Automatic Authorization**: Export button auto-redirects to Google OAuth2 if not authenticated
- **OAuth2 Implementation**:
  - `src/utilities/google-oauth.ts` - Token management and authentication utilities
  - API endpoints: `/api/google/authorize`, `/api/google/callback`, `/api/google/status`, `/api/google/logout`
  - Frontend integration with auto-redirect and toast notifications
  - Token storage in `.google-token.json` with automatic refresh
- **Security**: Proper token handling, no sensitive data in code, `.google-token.json` in `.gitignore`
- **Documentation**: Complete setup guide in `docs/GOOGLE_OAUTH_SETUP.md`

### CI/CD Database Fix
- **Database Schema Initialization**: Created `scripts/init-db.ts` to initialize Payload schema
- **GitHub Actions**: Replaced `pnpm payload migrate` with `pnpm run init:db` before build
- **Fixed**: "relation 'users' does not exist" error in CI test suite

### Documentation Restructure
- **docs/ folder**: Moved all documentation files to `/docs/` folder
- **Root files**: Only `README.md`, `PLAN.md`, `CHANGELOG.md` remain in root
- **Updated links**: All documentation references now point to `/docs/` folder

### Test Suite Fixes
- **TypeScript Error**: Fixed `payload.collections.length` error in `scripts/init-db.ts`
- **Missing Dependency**: Added `tsx` as dev dependency for CI/CD script execution
- **Lockfile Sync**: Updated `pnpm-lock.yaml` to match `package.json`
- **E2E Server**: Configured Playwright to start production server in CI
- **E2E Seed Script**: Created `scripts/seed-e2e.ts` to seed test user and minimal data
- **Environment Variables**: Added all required env vars for build and E2E tests

## [0.3.0] - 2026-03-03

### Testing Infrastructure
- Added comprehensive test suite with Vitest (integration) and Playwright (E2E)
- Created isolated test database configuration (`docker-compose.test.yml`, `.env.test`)
- Added GitHub Actions CI/CD workflow (`.github/workflows/test.yml`):
  - Runs on every push/PR to `main` and `develop` branches
  - Executes lint, type check, integration tests, and E2E tests
  - Uploads Playwright reports as artifacts
- Created test files:
  - `tests/integration/seed.test.ts` - Seed function validation (8 tests)
  - `tests/integration/access-control.test.ts` - Permission testing (7 tests)
  - `tests/e2e/admin-login.spec.ts` - Login flow tests (3 tests)
  - `tests/e2e/database-manager.spec.ts` - Database manager UI tests (4 tests)
  - `tests/e2e/generation-flow.spec.ts` - Navigation and collection tests (6 tests)
- Added developer convenience tools:
  - `Makefile` with simple commands (`make test`, `make dev`, `make seed`)
  - Git hooks (`.husky/pre-commit`, `.husky/pre-push`) for automatic quality checks
  - `TESTING.md` - Complete testing documentation
  - `QUICKSTART.md` - Daily workflow guide
- Added npm scripts: `test:watch`, `test:db:up`, `test:db:down`

### Database Management
- Created admin Database Manager UI component (`src/components/DatabaseManager.tsx`):
  - One-click "Reset & Seed Database" button
  - Individual "Reset Database" and "Seed Database" buttons
  - Confirmation dialogs for destructive actions
  - Real-time feedback with success/error messages
  - Integrated into admin dashboard via `beforeDashboard` component
- Added admin-only API endpoints:
  - `POST /api/database/reset` - Clears Resume Profile global and deletes all resume collections
  - `POST /api/database/seed` - Seeds complete resume data
- Updated reset operation to include Resume Profile global clearing

### Resume Data Seeding
- Expanded complete seed script (`src/endpoints/seed-resume-complete.ts`):
  - Added Site Settings global with social links (Portfolio, Email, LinkedIn, GitHub)
  - Increased projects from 15 to 25 (added WordPress sites and automation tools)
  - Now seeds: 1 Site Settings + 1 Resume Profile + 9 Experiences + 25 Projects + 1 Education + 65 Certifications
- Updated seed summary logging to include all seeded data counts
- Added all missing WordPress website projects and automation projects from resume

### Google Docs Export
- Fixed "Drive storage quota exceeded" error:
  - Updated Google Auth scopes from `drive.file` to full `drive` scope
  - Added `supportsAllDrives: true` parameter to Drive API calls
  - Implemented automatic ownership transfer from service account to folder owner
  - Files now use folder owner's storage quota instead of service account's
- Added error handling for ownership transfer failures
- Updated `src/utilities/google-docs.ts` with proper shared folder support

### Site Settings Global
- Added Site Settings global seeding with:
  - Site name: "Ronald Allan Rivera - Resume Builder"
  - Default meta title and description
  - Social links array (Portfolio, Email, LinkedIn, GitHub)
- Social links now available for use in resume generation

### Developer Experience
- Created helper script `scripts/show-service-account-email.ts` to display Google service account email
- Updated Database Manager UI text to reflect all operations (Site Settings + Resume Profile)
- Added comprehensive documentation for testing workflows

## Unreleased

- Added admin UI copy-to-clipboard buttons on `generations` edit view:
  - Resume Draft: copy as plain text or markdown.
  - Application Letter: copy as plain text.
- Added PDF downloads for `generations` edit view (Resume Draft + Application Letter) via `GET /next/generations/[id]/pdf?type=resume|letter`.
- Fixed PDF download runtime failures (`ENOENT` for `Helvetica.afm`) by switching server-side PDF generation from `pdfkit` to `pdf-lib`.
- Prevented “Header:” label from appearing in generated application letters (prompt tightened + server-side cleanup of leading label).
- Added `company` relationship field to `generations` (read-only) that auto-syncs from `jobAd.company`:
  - Enforced non-updatable at field level (`access.update: () => false`) and admin readOnly.
  - Added `beforeChange` hook to sync company on create/update and `afterRead` hook for legacy docs.
  - Added admin-only backfill endpoint `/next/backfill-generations-company` to populate existing records.
  - Company now displays correctly in Generations list and edit views (same pattern as Job Ads).
- Improved Generations create view relationship dropdown UX:
  - Job Ad labels show `Company – Title` (via `jobAds.displayTitle`).
  - Job Ads and Resume Profiles are sorted by most recently created.
  - Added admin-only backfill endpoint `/next/backfill-jobads-displaytitle` to populate legacy `jobAds.displayTitle`.

## [0.2.0] - 2026-02-06

- Added admin-only “Delete versions…” menu item in the 3‑dot edit menu for all versioned collections.
- Deletes all stored versions for the current document only via a secure `/next/delete-versions` endpoint.
- Fixed Projects admin create/edit crash caused by the experimental slug UI field requiring `ServerFunctionsProvider`.
- Updated `projects` to use a plain `slug` text field with automatic generation from `title`.
- Added resume seeding utilities:
  - Admin-only dashboard button (“Seed resume data”).
  - Admin-only endpoint: `POST /next/seed-resume`.
  - CLI command: `npm run seed:resume`.
- Fixed markdown escaping artifacts in seeded resume content (e.g. `\\-` in titles).

- Added Phase 5 “Job Ads → Generations” AI workflow:
  - New collections: `companies`, `jobAds`, `resumeProfiles`, `generations`.
  - New globals: `coverLetterSettings`, `aiGenerationSettings`.
  - Admin/editor-only endpoint: `POST /next/generate-drafts`.
  - Generates `resumeDraft` + `applicationLetter` using database facts only.
  - Adds an AI selection step to pick job-relevant experiences/projects/certs/education by ID.

- Added admin UX documentation helpers in `Globals → AI Generation Settings`:
  - Collapsible shortcode reference (hidden by default) for prompt templates.
  - Collapsible help for `promptVersion`, `model`, and `temperature` (allowed values + cost guidance).
  - Added Job Ad + Company prompt variables/shortcodes (e.g. `{{jobAdTitle}}`, `{{companyWebsite}}`).

- Improved resume prompt templating + formatting:
  - Added configurable `experienceRewritePrompt` to `aiGenerationSettings` to allow a dedicated AI rewrite step for CURRENT experiences.
  - Added AI-customized experience shortcodes (current experiences):
    - `{{professionalExperienceBlocksCustomized}}`
    - `{{professionalExperience1BlockCustomized}}`, `{{professionalExperience2BlockCustomized}}`
    - `{{professionalExperience1TitleCustomized}}`, `{{professionalExperience2TitleCustomized}}`
    - `{{professionalExperience1HighlightsCustomized}}`, `{{professionalExperience2HighlightsCustomized}}`
  - Sanitized AI-returned highlights to avoid double bullet markers.
  - Adjusted default resume output formatting to be shorter:
    - Core Skills rendered as a single comma-separated line.
  - Updated system prompt defaults to avoid conflicts with the experience rewrite step while keeping “no hallucinations” constraints.

- Fixed TypeScript build issues:
  - Avoid exporting `serverFunction` from Payload layout module.
  - Narrowed `deleteVersions` route collection typing to satisfy Payload `CollectionSlug`.

## [0.1.0] - 2026-02-01

- Implemented initial resume/portfolio CMS data model (collections + globals).
- Added minimal RBAC (`admin`, `editor`) to `users`.
- Enforced private-by-default resume contact fields with publish toggles.
- Updated seed endpoint to match new global typings and RBAC.
- Updated `.env.example` to reflect PostgreSQL and include placeholders for Vercel Blob, OpenAI, and Google Docs.
- Completed Google Docs service account setup for Drive exports (shared folder + env vars populated).

## 2026-01-31

- Reinstalled the Payload Website Template via `create-payload-app`.
- Configured local development to use PostgreSQL via Docker.
- Verified local app is running:
  - Frontend: `http://localhost:3000`
  - Admin: `http://localhost:3000/admin`
- Added environment variable placeholders for:
  - Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
  - OpenAI (`OPENAI_API_KEY`)
  - Google Docs export (`GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`, `GOOGLE_DRIVE_FOLDER_ID`)
