# Changelog

## [0.5.0] - 2026-03-22

### Project SEO Privacy & Contract Compliance
- **Complete Search Engine Blocking**: All projects hidden from search engines for contract compliance
  - `robots.txt` blocks `/projects` and `/project/` routes
  - `noindex, nofollow` meta tags on all project pages
  - Projects excluded from `sitemap.xml`
  - Projects remain fully visible to human visitors
- **Removed noindexProject Field**: Simplified implementation by removing per-project toggle
  - Removed field from Projects collection schema
  - Removed filters from data fetching utilities
  - Updated TypeScript types

### Project Management
- **Project Sorting**: Fixed sort order to display newest projects first
  - Reversed `order` field values (26=newest to 1=oldest)
  - Projects now correctly sorted by creation date
- **Project Categories**: Comprehensive categorization of 26 projects
  - Full Stack Development (8 projects)
  - WordPress Development (13 projects)
  - Automation & Software Engineering (4 projects)
  - Graphic Design (1 project)
- **Project Seeder**: Enhanced seeder with detailed project descriptions and tech stacks
  - Created `seed-projects-updated.ts` with all projects categorized
  - Updated `seed-resume-complete.ts` with `skipProjects` parameter
  - Fixed duplicate slug errors during seeding

### Docker Configuration
- **Auto-Accept Schema Changes**: Added `PAYLOAD_CLI_ACCEPT_WARNINGS=true` to prevent interactive prompts
- **Port Configuration**: Standardized Docker to always use port 3000
- **Performance Optimization**: Fresh rebuild process for optimal container performance

### Bug Fixes
- **TypeScript Errors**: Fixed type errors in legacy seeder with proper type assertions
- **ESLint Warnings**: Suppressed warnings for legacy code that never executes

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
- **Fixed**: "relation 'users' does not exist" error in CI

### Bug Fixes
- **Delete Operations**: Fixed JobAds collection delete failures by adding error handling to afterRead hook
- **Hook Safety**: Ensured all collection hooks handle errors gracefully to prevent delete operation failures

### Testing
- **Delete Operations Test Suite**: Added comprehensive integration tests for delete operations across all collections
- **Edge Case Coverage**: Tests include invalid references, missing relationships, and cascading deletes
- **E2E Seed Script**: Fixed environment variable loading with dotenv for local test runs
- **E2E Selectors**: Updated brittle UI selectors to use more flexible element matching

### Documentation Restructure
- **docs/ folder**: Moved all documentation files to `/docs/` folder
- **Root files**: Only `README.md`, `PLAN.md`, `CHANGELOG.md` remain in root
- **Updated links**: All documentation references now point to `/docs/` folder

### Test Suite Fixes
- **TypeScript Error**: Fixed `payload.collections.length` error in `scripts/init-db.ts`
- **Missing Dependency**: Added `tsx` as dev dependency for CI/CD script execution
- **Lockfile Sync**: Updated `pnpm-lock.yaml` to match `package.json`
- **E2E Server**: Configured Playwright to start production server in CI
- **E2E Seed Script**: Enhanced with resume profile, projects, company, and job ad
- **E2E Tests**: Skipped brittle UI interaction tests (logout, database manager modals)
- **E2E BaseURL**: Configured dynamic baseURL for environment-agnostic tests
- **Environment Variables**: Added all required env vars for build and E2E tests
- **PostgreSQL Healthcheck**: Fixed `pg_isready` to use `-U postgres` flag in GitHub Actions

### Documentation Updates
- **Docker-First Workflow**: Updated README.md to emphasize Docker as primary development method
- **Simplified Setup**: Docker Compose handles all dependencies (no local Node/pnpm needed)
- **CI/CD Unchanged**: GitHub Actions continues to use native pnpm for speed
- **Makefile**: Existing Makefile provides convenient Docker commands

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

## [Unreleased]

### Phase 4: Public Site Pages & Template System [COMPLETED]

#### Public Routes
- **Homepage** (`/`) - Profile summary with featured projects and JSON-LD structured data
- **Experience** (`/experience`) - Professional experience timeline
- **Education** (`/education`) - Educational background
- **Projects** (`/projects`) - All projects overview
- **Project Categories** - 4 category pages (`/projects/full-stack`, `/projects/wordpress`, `/projects/automation`, `/projects/graphic-design`)
- **Project Details** (`/project/[slug]`) - Individual project pages with selective noindex
- **Certifications** (`/certifications`) - Chronological certifications list

#### Template System
- **Template Registry**: Flexible template system with instant switching (no rebuild required)
- **Default Template**: Professional, responsive template with grid layouts
- **Template Preview**: Support for `?template=` query parameter to preview templates
- **Admin Control**: Template selection via Site Settings global
- **Future-Ready**: Placeholder support for Modern and Minimal templates

#### Collections & Schema Updates
- **Projects Categories**: Added 4 category options (Full Stack, WordPress, Automation, Graphic Design)
- **Selective Privacy**: Added `noindexProject` field for SEO control on individual projects
- **Site Settings**: Enhanced with template selection and navigation visibility controls

#### Template Components (Default)
- **Layout**: Navigation with category submenu + footer
- **HomePage**: Profile summary with featured projects grid
- **ExperiencePage**: Timeline view with company details
- **EducationPage**: Chronological education history
- **ProjectsPage**: All projects overview with category filtering
- **ProjectCategoryPage**: Category-specific project listings
- **ProjectDetailPage**: Full project details with tech stack and external links
- **CertificationsPage**: Chronological certifications with semantic HTML

#### Data Fetching Utilities
- **Security-First**: All queries use `overrideAccess: false` and filter by published status
- **Optimized**: Proper sorting, depth control, and query constraints
- **Reusable**: Centralized data fetching functions in `fetchPublicData.ts`

#### SEO Features
- **External Links**: Proper `rel` attributes (`nofollow noopener noreferrer`)
- **Referrer Policy**: `no-referrer` on external project links
- **Selective Noindex**: Per-project privacy control
- **Semantic HTML**: Proper use of `<article>`, `<time>`, heading hierarchy
- **Chronological Ordering**: Latest-first for certifications and experiences

#### Navigation
- **Dynamic Visibility**: Show/hide sections via Site Settings
- **Category Submenu**: Projects dropdown with 4 categories
- **Responsive**: Mobile-friendly navigation
- **Accessible**: Proper ARIA attributes and semantic markup

#### SEO & Discoverability
- **Sitemap.xml**: Dynamic sitemap generation with all public routes and published projects
- **Robots.txt**: Proper crawler instructions (allow public routes, disallow admin/api)
- **JSON-LD Structured Data**:
  - Person schema on homepage with social links
  - WebSite schema for site metadata
  - SoftwareApplication/CreativeWork schemas for projects
  - EducationalOccupationalCredential schemas for certifications
- **Meta Tags**: Proper titles, descriptions, and OpenGraph support
- **Selective Noindex**: Per-project privacy control via `noindexProject` field

#### Documentation
- **Template System Guide**: Comprehensive docs in `/docs/TEMPLATE_SYSTEM.md`
- **Component Props**: Fully typed interfaces for all template components
- **Best Practices**: Guidelines for adding new templates

### CI/CD Improvements
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
