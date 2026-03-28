# Changelog

## [0.8.4] - 2026-03-28

### Animated 3D Starfield Background

**Interactive Canvas Animation with Progressive Enhancement**
- **Created Starfield Component**: Reusable React component with 3D rotating starfield animation
  - 4,300 stars distributed in 3D spherical space
  - Real-time 3D rotation with yaw, pitch, and roll transformations
  - Depth-based perspective projection for realistic star sizing
  - Stars sorted by depth (back-to-front rendering)
- **Interactive Mouse Movement**: Dynamic rotation speed based on mouse activity
  - Smooth physics with inertia and damping
  - Rotation speeds up when mouse moves, coasts when idle
  - Multi-layer smoothing for premium feel
  - Procedural speed variation with sine waves
- **Visual Effects**: Professional polish with multiple rendering techniques
  - Twinkling stars with individual speeds and offsets
  - Glow effects on brighter stars (3 brightness tiers)
  - Varying star sizes (0.42px to 3.4px)
  - Alpha transparency for depth perception
- **Progressive Enhancement**: CSS gradient fallback for instant loading
  - Existing CSS background shows immediately
  - Canvas animation layers on top when JavaScript loads
  - No blank screen on slow connections
  - Graceful degradation if JavaScript disabled
- **Accessibility First**: Respects user preferences
  - Honors `prefers-reduced-motion` media query
  - `aria-hidden="true"` (decorative element)
  - `pointer-events: none` (doesn't block interactions)
- **Performance Optimized**: 60fps smooth animation
  - `requestAnimationFrame` for optimal timing
  - Viewport culling (only renders visible stars)
  - Device pixel ratio capped at 2x
  - Efficient canvas clearing with `clearRect`
  - Proper cleanup on component unmount

**Implementation**
- Integrated on homepage hero section (`/`)
- Integrated on All Projects page hero (`/projects`)
- Reusable component: `<Starfield />` can be added to any page
- Canvas opacity set to 85% to blend with CSS background

**Technical Details**
- TypeScript with full type safety and null checks
- React hooks (`useEffect`, `useRef`) for lifecycle management
- 3D mathematics: spherical distribution, rotation matrices, perspective projection
- Smooth damping functions for natural motion
- Event listeners with passive flag for performance

**Files Created**
- Created: `src/templates/rainbow/components/Starfield.tsx`

**Files Modified**
- Updated: `src/templates/rainbow/components/Hero.tsx`
- Updated: `src/templates/rainbow/AllProjectsPage.tsx`

## [0.8.3] - 2026-03-28

### Unified ProjectCard Component

**Reusable Card Design Across All Pages**
- **Created ProjectCard Component**: Extracted reusable project card component from AllProjectsPage
  - Single source of truth for project card design
  - Used across Featured Work, Latest Projects, and All Projects pages
  - Eliminates 450+ lines of duplicate code
- **Bright Gradient Backgrounds**: Updated to vibrant, eye-catching color schemes
  - 11 gradient variations (emerald-cyan-blue, rose-orange-amber, etc.)
  - Consistent with All Projects page design
  - Removed dark, muted gradients in favor of bright colors
- **Dynamic Floating Tech Stack Icons**: Smart icon positioning with fallbacks
  - Up to 10 icons per card with dynamic sizing
  - Extracts icons from tech stack and project descriptions
  - Generic fallback icons ensure minimum 3 icons per card
- **Glass Morphism Title Overlays**: Semi-transparent dark overlays at card bottom
  - Category badge (FULL STACK, WORDPRESS, etc.)
  - Project title in large, bold text
  - Backdrop blur effect for depth
- **Gradient Action Buttons**: Yellow→Orange→Pink gradient for View Live/View Code
- **Full Description Visible**: All project summaries displayed on cards
- **Consistent Spacing**: Professional polish with unified shadows and borders

**Technical Improvements**
- DRY principle: Single ProjectCard component replaces 3 duplicate implementations
- Better maintainability: Update once, applies everywhere
- Type safety: Consistent TypeScript interfaces
- Clean architecture: Separation of concerns
- Added `data-version="v2-unified"` attribute for debugging

**Files Modified**
- Created: `src/templates/rainbow/components/ProjectCard.tsx`
- Updated: `src/templates/rainbow/components/FeaturedWork.tsx`
- Updated: `src/templates/rainbow/components/LatestProjects.tsx`
- Updated: `src/templates/rainbow/AllProjectsPage.tsx`

## [0.8.2] - 2026-03-27

### All Projects Page Implementation

**Complete Portfolio Showcase**
- **New `/projects` Route**: Dedicated page displaying all 26 projects organized by category
- **Netflix-Style Hero Section**: Project statistics (26 projects, 4 categories, 20+ years experience, Live production status)
- **Category Organization**: Projects grouped by Full Stack → WordPress → Automation → Design priority
- **Smart Project Ordering**: Projects sorted by `order` field (lower = higher priority) within each category
- **Header Navigation Enhancement**: Added Projects dropdown menu with category sub-links
  - All Projects
  - Full Stack Development (8 projects)
  - WordPress Development (13 projects)
  - Automation & Software Engineering (4 projects)
  - Graphic Design (1 project)
- **Anchor Link Navigation**: Hash-based navigation to category sections with scroll-margin optimization
- **Scroll Position Fix**: Added `scroll-mt-24` to sections for proper spacing below fixed header
- **Reusable CTAButtons Component**: Extracted CHAT WITH AI and BOOK ME NOW buttons for reuse across pages
  - Configurable `className`, `chatHref`, and `bookHref` props
  - Default navigation to homepage contact section (`/#contact`)
  - Used in both Hero and AllProjectsPage components
- **Absolute Path Navigation**: Fixed all header links to use absolute paths (`/#section`) for proper navigation from internal pages
- **Clean Implementation**: Removed buggy filter navigation in favor of simple HTML anchor-based scrolling
- **Project Card Design**: Gradient backgrounds, floating tech stack icons, and View Live/View Code buttons
- **Mobile Responsive**: Full mobile menu support with category sub-items

**Technical Improvements**
- Converted navigation links from relative (`#section`) to absolute (`/#section`) paths
- Optimized performance by removing unnecessary state management
- Applied KISS principle - native browser features over complex JavaScript
- Zero lint warnings with proper TypeScript types

## [0.8.1] - 2026-03-25

### Rainbow Homepage Project Showcase Enhancements

- Added a new `Featured Work` homepage section for Payload-managed featured projects.
- Added dynamic floating tech stack icons on project media using `react-icons`.
- Implemented count-aware icon positioning so layouts adapt to available tech tags.
- Added fallback icon resolution from project descriptions plus generic fallbacks to ensure a minimum icon presence per card.
- Added glass morphism project title overlays and removed duplicate category/title content from project bodies.
- Tuned overlay opacity and icon sizing for large and small project cards.
- Removed distracting active styling from the Rainbow `Home` navigation item.
- Added a new `Latest Projects` section limited to 3 cards:
  - latest non-featured Full Stack project
  - latest non-featured WordPress project
  - latest non-featured Automation project
- Added `getLatestProjectByCategory` to support category-specific homepage project selection.
- Matched `Open Link` button gradients to Rainbow navigation colors for both Featured Work and Latest Projects.

## [0.8.0] - 2026-03-25

### Rainbow Theme Implementation

**Modern Space-Themed Template**
- **Glass Morphism Navigation**: Dark glass container with backdrop blur, border effects, and shadow
- **Unique Gradient Colors**: Each menu item has distinct gradient on hover (7 different color schemes)
- **Active State Detection**: Only Home link shows active state when on homepage
- **Proper Link Types**: `<Link>` for page navigation, `<a>` for anchor sections
- **Fully Responsive**: Mobile menu with toggle, smooth transitions, and touch-friendly targets

**Animated Hero Section**
- **Starfield Background**: CSS-based animated stars with multiple layers and glow effects
- **Space Theme**: Dark gradient overlays, cockpit glow effects, and atmospheric styling
- **Dynamic Content**: All content managed via Resume Profile global (no hardcoded text)
- **Three Content Fields**: Headline badge, summary heading, hero description
- **CTA Buttons**: White primary button and glass morphism secondary button with hover animations
- **Client Component**: Converted to Client Component with external CSS file (Hero.css)

**Layout System**
- **Server Component**: Layout remains Server Component with CSS import
- **Admin Element Hiding**: CSS rules to hide Payload admin bar and root layout header/footer
- **Dark Background**: Space theme with `bg-[#050608]` background color
- **Fixed Header**: Highest z-index (9999) ensures Rainbow header always visible
- **Clean Separation**: Rainbow header visible, Payload elements hidden via CSS

**Content Management**
- **Resume Profile Integration**: All hero content managed at `http://localhost:3000/admin/globals/resumeProfile`
- **New Field Added**: `heroDescription` field for full description paragraph
- **Three Editable Fields**:
  - `headline`: Badge text (e.g., "Full-Stack Web Developer | Python, Laravel, WordPress | 20+ Years Experience")
  - `summary`: Main hero heading (e.g., "I build scalable web apps, powerful WordPress systems, and AI-driven tools.")
  - `heroDescription`: Description paragraph (e.g., "Ronald Allan Rivera is a Web Designer and Programmer...")
- **No Hardcoded Fallbacks**: All content fully dynamic from database

**Technical Implementation**
- **Fixed Pages Collection Error**: Removed `DeleteVersionsMenuItem` causing "useServerFunctions must be used within a ServerFunctionProvider" error
- **Server Component Compatibility**: Avoided styled-jsx in Server Components by using external CSS files
- **External CSS Files**: Created `Hero.css` and `Layout.css` for complex animations and admin element hiding
- **TypeScript Safety**: Proper typing with Payload generated types
- **Best Practices**: Semantic HTML, ARIA labels, accessibility, mobile-first design

**Menu System**
- **7 Menu Items**: Home, Featured Work, Projects, Experience, Education, Certifications, Contact
- **Gradient Color Schemes**:
  - Home: Pink → Yellow → Purple
  - Featured Work: Yellow → Orange → Pink
  - Projects: Purple → Pink → Red
  - Experience: Green → Cyan → Blue
  - Education: Blue → Indigo → Purple
  - Certifications: Teal → Emerald → Green
  - Contact: Cyan → Sky → Blue
- **Smooth Transitions**: 300ms transition duration for all hover effects
- **Shadow Effects**: Glowing shadows matching gradient colors on hover

**Bug Fixes**
- Fixed active link detection (only Home shows active on homepage, not anchor links)
- Fixed menu gradient colors (each menu item now has unique gradient)
- Fixed Payload header visibility (properly hidden for Rainbow template)
- Fixed Server Component errors (converted Hero to Client Component, removed styled-jsx)

## [0.7.0] - 2026-03-24

### Certifications Categorization System

**Category Organization**
- **9 Categories Implemented**: Frontend & JavaScript (11), Laravel & Backend (12), Python & Django (8), WordPress (6), AI & ML (5), Cloud/DevOps (9), Git & Collaboration (6), Video & Creative (6), General Development (1)
- **63 Certifications**: All certifications properly categorized with explicit category field
- **Centralized Data Source**: Created `src/endpoints/certifications-data.ts` as single source of truth
- **Admin Integration**: Seed buttons now use categorized data automatically

**UI Improvements**
- **Grouped Display**: Certifications grouped by category with headers showing category name and count
- **Card Layout**: Each certification displayed in a card with gradient header matching category
- **Smart Sorting**: Certifications sorted by newest first (issue date) within each category
- **Visual Hierarchy**: Category sections clearly separated with proper spacing and styling

**Code Quality**
- **Single Source of Truth**: Removed duplicate standalone seed script
- **Type Safety**: Proper TypeScript typing with `as const` for category values
- **Maintainability**: All certification data in one file, imported by seed functions
- **Best Practices**: Consistent code formatting and proper URL line breaks

## [0.6.0] - 2026-03-24

### UI/UX Improvements - Experience, Education & Projects Pages

**Experience Page**
- **Date Formatting**: Fixed dates to display as "MMM YYYY" format (e.g., "Jun 2015" instead of ISO timestamps)
- **RECENT/EARLIER Grouping**: Most recent experience highlighted with blue accent, earlier experiences grouped separately
- **Responsibilities Display**: Shows position title, date range, and bullet-pointed responsibilities from highlights array
- **Professional Layout**: Clean design with left border accents and proper spacing

**Education Page**
- **Date Formatting**: Fixed dates to display as "MMM YYYY" format
- **Location Display**: Shows school name with location (e.g., "Quezon City, Philippines")
- **Consistent Styling**: Matches experience page layout for visual coherence

**Projects Page - Complete Redesign**
- **Card-Based Design**: All project information visible in cards without needing individual project pages
  - Title, category tag, summary, tech stack, and action buttons all in one view
  - Expandable "Full Description" button for detailed content
- **Tech Stack Tags**: Displayed as rounded pills with gray background (ready for custom styling)
- **Action Buttons**: 
  - Green "View Live Site" button for live URLs
  - Gray "View Code" button for repository URLs
- **Category Organization**: 
  - Projects grouped by category in specific order: Full Stack → WordPress → Automation → Graphic Design
  - Shows project count per category
- **Smart Sorting**: Projects sorted by newest first within each category (based on order field)
- **Removed Individual Project Pages**: `/project/[slug]` routes removed - all content now on main projects page
- **Client-Side Interactivity**: React state for expand/collapse functionality
- **Template Registry Cleanup**: Removed ProjectDetailPage from template system

### Code Quality
- **DRY Principles**: Reusable ProjectCard component used across ProjectsPage and ProjectCategoryPage
- **Best Practices**: 
  - Semantic HTML with proper article/section tags
  - Security: `rel="nofollow noopener noreferrer"` on external links
  - Responsive grid layouts (1/2/3 columns)
  - Smooth transitions and hover effects

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
