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
- **Complete seed script** with 100 resume items (Site Settings + Resume Profile + 9 Experiences + 25 Projects + 1 Education + 63 Certifications with categories)
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
  - Booking system (Phase 4C):
    - `STRIPE_PUBLISHABLE_KEY`
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `NEXT_PUBLIC_BOOKING_ENABLED`
    - `BOOKING_TIMEZONE`
    - `BOOKING_BUFFER_MINUTES`
    - `BOOKING_CONFIRMATION_HOURS`
    - `BOOKING_ADVANCE_NOTICE_DAYS`
    - `BOOKING_PAYOUT_MODE`

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

## Phase 4 — Public site pages (SEO-first) [COMPLETED]

### Requirements
- **Project Categories**: 4 categories as submenu navigation ✅
  - Full Stack Development
  - WordPress Development
  - Automation & Software Engineering
  - Graphic Design
- **Project Privacy**: Triple-Layer SEO Blocking (Enhanced Implementation) ✅
  - ALL projects hidden from search engines for contract compliance
  - **Layer 1 - robots.txt**: Disallows `/projects` and `/projects/*` routes
  - **Layer 2 - Meta tags**: `noindex, nofollow` on all project pages
  - **Layer 3 - Sitemap**: Projects excluded from XML sitemaps
  - **External links**: `rel="nofollow noopener noreferrer"` on all project links
  - Projects remain fully visible to human visitors
  - Configuration: `next-sitemap.config.cjs` + page-level metadata
- **Certifications**: Single page, chronological (latest to oldest), SEO-optimized
- **Template System**: Instant switching (no rebuild required)
- **Brand Colors**: Template-specific (no CMS needed, hardcoded in template files)

### Public Routes (App Router) ✅
- `/` Home/overview (summary + featured projects) ✅
- `/experience` Experience timeline/list ✅
  - Proper date formatting (MMM YYYY)
  - RECENT/EARLIER grouping
  - Position, company, and responsibilities displayed
- `/education` Education history ✅
  - Proper date formatting (MMM YYYY)
  - School, location, and degree displayed
- `/projects` All projects overview ✅
  - **Card-based design** - all project info visible without clicking through
  - Grouped by category (Full Stack → WordPress → Automation → Graphic Design)
  - Expandable full descriptions
  - Tech stack tags (ready for custom backgrounds)
  - View Live Site and View Code buttons
  - Projects sorted by newest first within each category
- `/projects/full-stack` Full Stack Development category ✅
- `/projects/wordpress` WordPress Development category ✅
- `/projects/automation` Automation & Software Engineering category ✅
- `/projects/graphic-design` Graphic Design category ✅
- ~~`/project/[slug]` Project detail~~ **REMOVED** - All content now on main projects page
- `/certifications` All certifications (chronological, SEO-optimized) ✅
- Optional later:
  - `/about`
  - `/contact`
  - `/resume.pdf`

### Template System (Instant Switching) ✅
- Choose template via `siteSettings.publicTemplate` with safe allowlist ✅
- Support preview override via query param (`?template=modern`) ✅
- Template registry pattern (map template key -> layout/components) ✅
- ISR/dynamic rendering for instant template changes ✅
- Keep core data fetching shared; templates only change presentation ✅
- Brand colors hardcoded per template (no CMS) ✅

### Rainbow Theme Implementation ✅
- **Modern space-themed design** with dynamic gradients and glass morphism ✅
- **Navigation System**:
  - Glass morphism container with backdrop blur and border effects ✅
  - Unique gradient colors for each menu item (7 different gradients) ✅
  - Active state detection (only Home link shows active on homepage) ✅
  - Proper link types: `<Link>` for pages, `<a>` for anchor sections ✅
  - Fully responsive with mobile menu toggle ✅
- **Hero Section**:
  - Animated starfield background with CSS animations ✅
  - Space-themed gradient overlays and glow effects ✅
  - Dynamic content from Resume Profile global ✅
  - Three content fields: headline badge, summary heading, hero description ✅
  - CTA buttons with hover animations ✅
  - Client Component with external CSS file (Hero.css) ✅
- **Layout System**:
  - Server Component with CSS import for hiding Payload admin elements ✅
  - Dark background (`bg-[#050608]`) for space theme ✅
  - Fixed header with highest z-index (9999) ✅
  - Clean separation: Rainbow header visible, Payload header hidden ✅
- **Content Management**:
  - All hero content managed via Resume Profile global 
  - Added `heroDescription` field to Resume Profile config 
  - No hardcoded fallbacks - fully dynamic from database 
  - Edit at: `http://localhost:3000/admin/globals/resumeProfile` 
- **Technical Implementation**:
  - Fixed Pages collection error (removed DeleteVersionsMenuItem) 
  - Converted Hero to Client Component to avoid styled-jsx Server Component errors 
  - Used external CSS files for complex animations (Hero.css, Layout.css) 
  - Proper TypeScript typing with Payload generated types 
  - Best practices: semantic HTML, accessibility, mobile-first design 
- **Homepage Project Showcase**:
  - Added a Payload-driven `Featured Work` section for featured projects on the Rainbow homepage ✅
  - Implemented dynamic floating tech stack icons using `react-icons` with fallback extraction from project descriptions ✅
  - Added count-aware icon positioning so project cards adapt to available tech tags/icons ✅
  - Added glass morphism title overlays to project media areas and removed duplicate title/category content below ✅
  - Added a `Latest Projects` section limited to 3 cards: latest non-featured Full Stack, WordPress, and Automation projects ✅
- **All Projects Page** (`/projects`):
  - Created dedicated portfolio showcase page with all 26 projects ✅
  - Netflix-style hero section with project statistics (26 projects, 4 categories, 20+ years, Live status) ✅
  - Category-organized sections (Full Stack → WordPress → Automation → Design) ✅
  - Smart project ordering by `order` field within each category ✅
  - Header dropdown navigation with category sub-menu ✅
  - Anchor link navigation with `scroll-mt-24` for fixed header spacing ✅
  - Reusable CTAButtons component (CHAT WITH AI, BOOK ME NOW) ✅
  - Absolute path navigation (`/#section`) for proper internal page routing ✅
  - Clean implementation using native HTML anchors (removed buggy filter navigation) ✅
  - Mobile responsive with full category sub-menu support ✅
- **Unified ProjectCard Component**:
  - Extracted reusable ProjectCard component from AllProjectsPage ✅
  - Single source of truth for project card design across all pages ✅
  - Bright, vibrant gradient backgrounds (11 color variations) ✅
  - Dynamic floating tech stack icons with smart positioning and fallbacks ✅
  - Glass morphism title overlays with category badges ✅
  - Gradient action buttons (View Live/View Code) ✅
  - Consistent design from Featured Work → Latest Projects → All Projects ✅
  - Eliminated 450+ lines of duplicate code ✅
  - DRY principle: Update once, applies everywhere ✅
- **Animated 3D Starfield Background**:
  - Created reusable Starfield component with interactive canvas animation ✅
  - 4,300 stars in 3D spherical space with real-time rotation ✅
  - Interactive mouse movement (rotation speeds up on interaction) ✅
  - Twinkling stars with varying brightness and glow effects ✅
  - Progressive enhancement: CSS gradient fallback for instant loading ✅
  - Accessibility: Respects `prefers-reduced-motion` media query ✅
  - Performance: 60fps with viewport culling and optimized rendering ✅
  - Integrated on homepage hero and All Projects page hero ✅
  - TypeScript with full type safety and proper null checks ✅
  - Reusable component: Can be added to any page with `<Starfield />` ✅
- **All Certifications Page** (`/certifications`):
  - Created AllCertificationsPage component for Rainbow template ✅
  - Hero section with animated starfield background and dynamic stats dashboard ✅
  - Duration-based card sizing (15+ hours = 2 columns wide, 5-14 hours = 2 columns on md, <5 hours = 1 column) ✅
  - Floating tech stack icons extracted from certification titles (3-5 icons per card) ✅
  - Tech icon extraction utility: `extractTechFromCertificationTitle()` ✅
  - Dynamic icon positioning with rotation and sizing (0.8 scale) ✅
  - Z-index layering: Duration badges appear above floating tech icons ✅
  - 11 rotating gradient variations for visual variety ✅
  - Category-organized sections (9 categories: Frontend & JavaScript, Laravel & Backend, Python & Django, WordPress, AI & ML, Cloud/DevOps, Git & Collaboration, Video & Creative, General Development) ✅
  - Header dropdown navigation with "All Certifications" and category sub-menu ✅
  - Duration badge, tech icons, and credential links on each card ✅
  - Reusable CTAButtons component for consistent navigation ✅
  - Responsive grid layout (1/2/3 columns based on screen size) ✅
  - Template registry integration with proper TypeScript typing ✅
  - Duration parsing utility converts "1h 32m" format to total hours ✅
  - Card span calculation uses dynamic Tailwind classes based on hours ✅
- **Dynamic Hero Section** (Rainbow template):
  - Database-driven tech stack tags from all projects ✅
  - Extracts unique tech stacks from project `techStack` field ✅
  - Sorts by usage count (most used first), alphabetically for ties ✅
  - Limited to top 8 most frequently used technologies ✅
  - Performance optimized with `useMemo` hook ✅
  - Automatically updates when projects change ✅
  - Type-safe implementation with proper null/undefined handling ✅
- **Latest Certifications Section** (Homepage):
  - Filters certifications by 10+ hours duration ✅
  - Shows top 3 most recent long-duration certifications ✅
  - Premium card design matching AllCertificationsPage ✅
  - Floating tech icons on each card (3-5 icons) ✅
  - Gradient headers with 3 color variations ✅
  - Glass morphism title overlay ✅
  - Duration badge and total hours display ✅
  - Duration parsing for filtering logic ✅
- **Tailwind CSS Best Practices Refactoring** (2026-04-02):
  - Comprehensive audit and removal of all inline CSS styles ✅
  - Replaced inline styles with Tailwind utility classes across all components ✅
  - Created custom `bg-card-bg` utility class in globals.css ✅
  - Added Tailwind v4 content paths configuration ✅
  - Added @source inline declarations for arbitrary values ✅
  - Fixed starfield transparency issues on certification cards ✅
  - Components refactored: Certifications, Education, Experience, FeaturedWork, Hero, ExperiencePage, EducationPage ✅
  - Performance improvements: Better CSS caching, smaller HTML payload ✅
  - Maintainability: Single source of truth for styling ✅
- **Mobile Performance Optimization & Loading Speed** (2026-04-02):
  - Removed all CSS gradient backgrounds from Hero component ✅
    - Eliminated 5 radial gradients + 1 linear gradient
    - Removed 30+ star gradient pseudo-elements (::before, ::after)
    - Pure transparent background for instant loading
  - Added pure black body background in layout.tsx ✅
    - `bg-black` class on body element
    - No flash of white on page load
    - Instant visual feedback
  - Disabled starfield on mobile via CSS media query ✅
    - Used `hidden md:block` Tailwind classes
    - No JavaScript detection overhead
    - Zero hydration delay
    - Eliminates 4,300 particle animation on mobile
  - Removed useState/useEffect from StarfieldClient ✅
    - No render blocking
    - No hydration mismatch
    - Instant rendering
    - Pure CSS-based mobile detection
  - Production Lighthouse scores achieved: 91 (mobile), 100 (desktop) ✅
  - Files modified: StarfieldClient.tsx, Hero.css, layout.tsx ✅
- **Code Cleanup - Deprecated Seed System Removed**:
  - Deleted legacy text-parsing seed approach (`seed-resume/index.ts`) ✅
  - Removed `/next/seed-resume` API route ✅
  - Updated ResumeSeedButton to use modern `/api/seed-resume` endpoint ✅
  - Single source of truth: `seed-resume-complete.ts` for all seeding ✅
  - Removed ~600 lines of deprecated code ✅
- **Contact Form** (`/contact`) with Resend Integration:
  - Created ContactPage component with starfield animation background ✅
  - Full-screen centered form with dark glassmorphism design ✅
  - Form fields: Name, Email, Company Website, Message, Referral Source ✅
  - Real-time validation with error/success feedback ✅
  - Loading states with animated spinner ✅
  - Serverless API route (`/api/contact`) for Vercel deployment ✅
  - Zod validation for type-safe input validation ✅
  - Multi-layer anti-spam protection: ✅
    - Rate limiting: 3 submissions per IP per hour ✅
    - Honeypot field for bot detection ✅
    - Spam content detection with pattern matching ✅
    - Email validation with proper regex ✅
  - Resend email integration with beautiful HTML templates ✅
  - Environment variable configuration (RESEND_API_KEY, CONTACT_FORM_TO_EMAIL, etc.) ✅
  - Reply-To header set to sender's email ✅
  - Optional CC recipients support ✅
  - Professional email formatting with metadata (IP, timestamp) ✅
  - Navigation updated: Contact link navigates to `/contact` ✅
  - Template registry integration with ContactPage ✅
  - SEO-optimized with metadata and OpenGraph tags ✅
  - Documentation: `docs/RESEND.md` - Comprehensive Resend integration guide ✅
- **Custom Domain Setup** (`allanai.dev`):
  - Domain purchased via Cloudflare ✅
  - Resend auto-configure for Cloudflare DNS (automatic DNS records) ✅
  - Custom email address configured: `contact@allanai.dev` ✅
  - Domain verified in Resend dashboard ✅
  - Email deliverability tested and confirmed working ✅
  - Documentation: `docs/DOMAIN_SETUP.md` - Complete production deployment guide ✅
  - Next steps for production deployment:
    - Vercel domain configuration (add domain, configure DNS, SSL/TLS)
    - Google OAuth update (authorized redirect URIs, JavaScript origins)
    - Environment variables update in Vercel (NEXT_PUBLIC_SERVER_URL, etc.)
    - Production testing checklist (contact form, OAuth, API routes, SSL)

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

- SEO requirements: ✅
  - Use `generateMetadata` per route ✅
  - `sitemap.xml` generated from Payload content ✅
  - `robots.txt` ✅
  - OpenGraph + Twitter card metadata on all public pages ✅
  - JSON-LD structured data (entity-first): ✅
    - `Person` for profile (include `sameAs` links) ✅
    - `WebSite` + `WebPage` ✅
    - Projects: `SoftwareApplication` when applicable (fallback to `CreativeWork`) ✅
  - Canonicals + clean slugs ✅
  - ISR for performance optimization ✅
    - Homepage & Projects: 5-minute revalidation (fresh content, fast loads)
    - Experience & Certifications: 1-hour revalidation (infrequent updates)
    - Contact: Dynamic rendering for real-time form submissions
    - Improved Core Web Vitals and SEO rankings
  - Internal linking (build a "topic graph"):
    - Link experiences to related projects/skills
    - Link projects to related certifications/skills
  - Content formatting for extraction:
    - Clear headings, short summaries near the top of each page
    - Prefer structured lists for skills/tech stacks
  - (Optional) Add `llms.txt` that points to the most important pages for AI crawlers

- Certifications UI (best-practice UX + a11y): 
  - Categorization system implemented with 9 categories (Frontend & JavaScript, Laravel & Backend, Python & Django, WordPress, AI & ML, Cloud/DevOps, Git & Collaboration, Video & Creative, General Development) 
  - Card-based layout with gradient headers per category 
  - Grouped display with category headers and certification counts 
  - Sorted by newest first within each category 
  - Centralized certifications data source (`src/endpoints/certifications-data.ts`) used by admin seed buttons 
  - Future enhancements:
    - "Netflix-style" horizontal rail with arrow controls and keyboard support
    - Responsive toggle: rail view vs grid view
    - Modal detail view with intercepting/parallel routes
    - Deterministic gradients/icons per certification

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
---

## Phase 4C — Enhanced Custom Booking System

**Status**: ✅ **Fully Implemented** (Last updated: 2026-04-10)

**Goal**: Professional freelance booking platform with package pricing, availability management, and Stripe payments that integrates seamlessly with your portfolio.

### **Why Custom Over Calendly (Best Practice for Freelancers)**

**Benefits:**
- 💰 **Revenue Generation**: Direct payment processing vs. just scheduling
- 🎨 **Full Brand Control**: Perfect integration with Rainbow theme
- 📦 **Package Pricing**: Display Day/Week/Month rates transparently
- 🎯 **Portfolio Context**: Link bookings to specific projects
- 📈 **Conversion Optimization**: Full control over user journey
- 🚀 **Scalability**: Build once, scale infinitely without monthly fees

**Freelance Context:**
- Primary goal: Convert portfolio visitors into paying clients
- Clients want transparent pricing and easy booking
- Custom system shows professionalism and technical capability
- Direct payments reduce friction and increase conversion rates

### Recent Enhancements (v0.11.1)

**Enhanced Calendar UI**
- **Two-Month Side-by-Side View**: Current + next month displayed simultaneously
  - Responsive: Horizontal on desktop, stacked on mobile
  - Full 6-week grid (42 cells) for consistent layout height
  - Month/year navigation with prev/next arrows
- **MUI-Inspired Design**: Modern aesthetic without external dependencies
- **Hydration-Safe Rendering**: Fixed SSR/client mismatch using `mounted` state pattern

**Auto-Detected Visitor Timezone (Worldwide Support)**
- **Automatic Detection**: Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` for any visitor worldwide
  - Works for USA, UK, Japan, Australia, Europe, etc.
  - No manual selection needed - detects from browser
- **Dual Time Display**: Shows visitor's local time with provider's timezone (Asia/Manila) as reference
  - Time slot buttons: Primary visitor time, provider time as subtitle when different
  - Confirmation page: Both timezones clearly labeled

**Bug Fixes & Improvements**
- Fixed timezone conversion bug (6 PM Manila showing as 2 AM)
- Fixed React hydration mismatch errors
- Added gradient CTA buttons with helper text
- Consistent header navigation styling

---

### Phase 4C.1 — Package System & Pricing Display (Priority: High)

**Status**: Implemented

**Implementation:**

1. **Package Collection Setup**
   ```typescript
   // Collection: packages
   {
     name: "30 Minute Consultation",
     slug: "30min-consultation",
     shortDescription: "Initial project discussion and requirements gathering",
     description: "Perfect for exploring project feasibility, discussing technical approach, and determining if we're a good fit for your needs.",
     price: 5000, // $50.00 in cents
     currency: "USD",
     durationType: "call",
     durationMinutes: 30,
     deliverables: [
       "Project requirements analysis",
       "Technical recommendations",
       "Timeline estimation",
       "Next steps roadmap"
     ],
     requiresScheduling: true,
     active: true,
     sortOrder: 1
   }
   ```

2. **Pricing Page Component**
   ```typescript
   // src/app/(frontend)/pricing/page.tsx
   export default function PricingPage() {
     return (
       <Layout>
         <PricingPage />
       </Layout>
     )
   }
   ```

3. **Package Card Component**
   ```typescript
   // src/templates/rainbow/components/PackageCard.tsx
   interface PackageCardProps {
     package: Package
     available: boolean
     onBook: (packageId: string) => void
   }
   ```

---

### Phase 4C.2 — Environment Variables & Configuration (Priority: High)

**Status**: Implemented

**Environment Variables (.env.local):**
```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Booking Configuration
NEXT_PUBLIC_BOOKING_ENABLED=true
BOOKING_TIMEZONE=Asia/Manila
BOOKING_BUFFER_MINUTES=15
BOOKING_HOLD_MINUTES=20

# Rate Limiting
BOOKING_RATE_LIMIT=3 per hour per IP
```

**Vercel Environment Variables:**
- Add same variables to Vercel project settings
- Use different values for Preview/Production
- Mark webhook secrets as sensitive

---

### Phase 4C.3 — Availability Management System (Priority: High)

**Status**: Implemented

**Implementation:**

1. **Availability Rules Collection**
   ```typescript
   // Collection: availabilityRules
   {
     timezone: "Asia/Manila",
     daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
     startTime: "09:00",
     endTime: "17:00",
     slotDurationMinutes: 30,
     bufferMinutes: 15,
     active: true
   }
   ```

2. **Time Slot Generation**
   - API endpoint: `/api/availability/slots`
   - Generate available slots based on rules
   - Exclude existing bookings
   - Handle timezone conversions

3. **Slot Hold System**
   - Create `pending_payment` booking when slot selected
   - Hold slot for 20 minutes during payment
   - Auto-release if payment not completed
   - Prevent double booking

---

### Phase 4C.4 — Stripe Payment Integration (Priority: High)

**Status**: Implemented

**Implementation:**

1. **Stripe Checkout Integration**
   ```typescript
   // src/lib/stripe.ts
   export async function createCheckoutSession(bookingId: string) {
     const booking = await payload.findByID({
       collection: 'bookings',
       id: bookingId
     })
     
     const session = await stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       line_items: [{
         price_data: {
           currency: booking.package.currency.toLowerCase(),
           unit_amount: booking.package.price,
           product_data: {
             name: booking.package.name,
             description: booking.package.shortDescription
           }
         },
         quantity: 1
       }],
       mode: 'payment',
       success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/book/cancel`,
       metadata: {
         bookingId: bookingId
       }
     })
     
     return session
   }
   ```

2. **Webhook Handler**
   ```typescript
   // src/app/api/webhooks/stripe/route.ts
   export async function POST(request: Request) {
     const signature = request.headers.get('stripe-signature')
     const body = await request.text()
     
     let event: Stripe.Event
     
     try {
       event = stripe.webhooks.constructEvent(
         body,
         signature!,
         process.env.STRIPE_WEBHOOK_SECRET!
       )
     } catch (err) {
       return new Response(`Webhook signature verification failed`, { status: 400 })
     }
     
     if (event.type === 'checkout.session.completed') {
       const session = event.data.object as Stripe.Checkout.Session
       await confirmBooking(session.metadata?.bookingId)
     }
     
     return new Response(null, { status: 200 })
   }
   ```

---

### Phase 4C.5 — Booking Flow & UI Components (Priority: High)

**Status**: Implemented

**Component Architecture:**

1. **PricingPage** (`/pricing`)
   - Display all active packages
   - Show availability status
   - Professional pricing presentation

2. **BookingPage** (`/book/[packageId]`)
   - Package details and benefits
   - Time slot selection
   - Customer information form
   - Payment processing

3. **BookingSuccessPage** (`/book/success`)
   - Booking confirmation
   - Calendar integration
   - Next steps

4. **CustomerPortal** (`/portal`)
   - Manage existing bookings
   - Reschedule or cancel
   - View booking history

---

### Phase 4C.6 — Customer Management (Priority: Medium)

**Status**: Planned

**Implementation:**

1. **Customer Collection**
   ```typescript
   // Collection: customers
   {
     email: "customer@example.com",
     name: "John Doe",
     phone: "+1234567890",
     timezone: "America/New_York",
     company: "Acme Corp",
     marketingConsent: true,
     providers: [{
       provider: "google",
       providerAccountId: "123456789"
     }]
   }
   ```

2. **OAuth Integration (Optional)**
   - Google OAuth for quick sign-in
   - Auto-fill customer information
   - Account linking for returning customers

---

### Phase 4C.7 — Notifications & Automation (Priority: Medium)

**Status**: ✅ Partially Implemented (2026-04-18 — booking request + payment emails live)

**Email Notifications:**
- ✅ Booking request received → customer acknowledgement (`src/lib/booking-email.ts`)
- ✅ New booking alert → admin notification (`src/lib/booking-email.ts`)
- ✅ Payment confirmed → customer receipt (`src/lib/booking-email.ts`)
- ✅ Payment received → admin alert (`src/lib/booking-email.ts`)
- Booking accepted/declined → customer notification (planned)
- 24-hour reminder (planned)
- 1-hour reminder (planned)
- Follow-up after booking (planned)

**Automation:**
- Calendar invites (Google Calendar)
- Project onboarding emails
- Feedback requests
- Review requests

---

### Phase 4C.8 — Security & Abuse Prevention (Priority: High)

**Status**: Partially Implemented (access control done, rate limiting pending)

**Security Measures:**
- Rate limiting: 3 bookings per hour per IP
- CAPTCHA on booking form
- Webhook signature validation
- Input sanitization and validation
- HTTPS enforcement
- PCI compliance via Stripe

**Access Control:**
- Public can only read active packages
- Booking creation requires valid payment
- Admin-only booking management
- Customer data protection

---

### Phase 4C.9 — Analytics & Optimization (Priority: Low)

**Status**: Planned

**Tracking:**
- Package conversion rates
- Payment success rates
- Booking completion rates
- Mobile vs desktop usage
- Time to complete booking

**Optimization:**
- A/B test package pricing
- Test different package descriptions
- Optimize booking flow
- Reduce cart abandonment

---

### Phase 4C.10 — Implementation Timeline

**Week 1: Foundation**
- [x] Set up Stripe account and test keys
- [x] Create packages collection and seed data
- [x] Build PackageCard component
- [x] Create basic pricing page

**Week 2: Booking System**
- [x] Implement availability rules
- [x] Build time slot generation
- [x] Create booking collection
- [ ] Implement slot hold system (pending - basic structure in place)

**Week 3: Payments**
- [x] Integrate Stripe Checkout
- [x] Build webhook handler
- [x] Create booking flow UI
- [ ] Test payment process (requires Stripe test mode verification)

**Week 4: Polish & Launch**
- [x] Add email notifications (✅ implemented: booking request + payment confirmed via `src/lib/booking-email.ts`)
- [x] Implement security measures (access control implemented, rate limiting pending)
- [ ] Mobile optimization (pending)
- [x] Documentation and testing (basic documentation complete)

---

### Phase 4C.11 — Admin UI & Collection Organization (Priority: High)

**Status**: Implemented

**Implementation:**

1. **Database Management Panel**
   - Added booking data seed/reset buttons to admin dashboard
   - Separate controls for Resume Data and Booking Data
   - Admin-only access with confirmation dialogs

2. **Collection Grouping**
   - **Booking**: Packages, Customers, Availability Rules, Bookings
   - **Content**: Pages, Posts, Media, Categories
   - **Resume**: Experiences, Educations, Projects, Certifications, Resume Profiles, Companies, Job Ads
   - **AI**: Generations
   - **System**: Users

3. **Seed Data API**
   - `/api/seed-booking` - Creates 4 sample packages and 2 availability rules
   - `/api/reset-booking` - Deletes all booking-related data
   - Admin authentication required

---

### Files to Create/Modify

**New Files:**
- `src/app/(frontend)/pricing/page.tsx` - Pricing page ✅
- `src/app/(frontend)/book/[packageId]/page.tsx` - Booking flow ✅
- `src/app/(frontend)/book/success/page.tsx` - Success page ✅
- `src/app/(frontend)/book/cancel/page.tsx` - Cancel page ✅
- `src/app/(frontend)/portal/page.tsx` - Customer portal (planned)
- `src/templates/rainbow/components/PricingPage.tsx` - Rainbow pricing ✅
- `src/templates/rainbow/components/PackageCard.tsx` - Package display ✅
- `src/templates/rainbow/components/BookingFlow.tsx` - Booking process ✅
- `src/lib/stripe.ts` - Stripe integration ✅
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler ✅
- `src/app/api/availability/slots/route.ts` - Time slots API ✅
- `src/app/api/bookings/route.ts` - Bookings API ✅
- `src/app/api/bookings/checkout/route.ts` - Stripe checkout API ✅
- `src/app/api/seed-booking/route.ts` - Seed booking data ✅
- `src/app/api/reset-booking/route.ts` - Reset booking data ✅
- `src/endpoints/seed-booking.ts` - Seed data function ✅
- `src/components/DatabaseManager.tsx` - Updated with booking controls ✅

**Modified Files:**
- `src/components/CTAButtons.tsx` - Update to pricing page ✅
- `src/templates/rainbow/components/CTAButtons.tsx` - Rainbow version ✅
- `src/templates/rainbow/components/Header.tsx` - Added Pricing link ✅
- `src/collections/Packages.ts` - Added Booking group ✅
- `src/collections/Customers.ts` - Added Booking group ✅
- `src/collections/AvailabilityRules.ts` - Added Booking group ✅
- `src/collections/Bookings.ts` - Added Booking group ✅
- All other collections - Added appropriate groups (Content, Resume, AI, System) ✅
- `src/payload.config.ts` - Configure collections ✅
- `.env.example` - Add new environment variables ✅

---

### Success Metrics

**Primary Metrics:**
- Booking conversion rate (visitors → paid bookings)
- Revenue per month from freelance work
- Customer satisfaction scores
- Payment success rate

**Secondary Metrics:**
- Time to complete booking
- Mobile vs desktop conversion
- Most popular packages
- Booking completion by time of day

---

### When to Scale Further

**Consider advanced features when:**
- Consistently getting 20+ bookings per month
- Need team scheduling capabilities
- Want advanced analytics and reporting
- Require automated workflows

**Potential Upgrades:**
- Team member booking
- Advanced analytics dashboard
- Automated project onboarding
- Integration with project management tools

Status: Planned

## Phase 4D — Search Functionality (Professional Portfolio Search)

**Goal**: Implement a comprehensive search system that allows recruiters and employers to quickly find relevant experience, projects, and certifications across the entire portfolio.

### Requirements Analysis (from SEARCH.md)

**Key Insights:**
- Search should feel like a **serious portfolio tool**, not a utility link
- Recruiters need to instantly find: "Next.js", "React", "AI", "WordPress plugin", "Python automation", "certifications"
- Current `/search` page is too basic (default search page with "Search submit" and "No results found")
- Search is a **navigation shortcut for recruiters** given the depth of content (27 projects, 63 certifications, 9+ experiences)

### Phase 4D.1 — Search Backend & API (Foundation)

**Status**: ✅ COMPLETED

**Implementation:**

1. **Search API Route** (`/api/search`)
   - Server-side search endpoint with Payload Local API
   - Multi-collection search across:
     - `experiences` (title, company, responsibilities, skills)
     - `projects` (title, description, techStack, summary, category)
     - `certifications` (name, issuer, category, description)
   - Query parameters:
     - `q` (search query, required)
     - `type` (filter: all | experience | projects | certifications)
     - `limit` (default: 50)
   - Response format:
     ```typescript
     {
       query: string
       totalResults: number
       results: {
         experiences: Array<Experience>
         projects: Array<Project>
         certifications: Array<Certification>
       }
       counts: {
         experiences: number
         projects: number
         certifications: number
       }
     }
     ```

2. **Search Algorithm**
   - **Multi-field matching** with priority scoring:
     - Title/Name matches: highest priority
     - Tech stack/Skills matches: high priority
     - Description/Summary matches: medium priority
     - Category matches: low priority
   - **Keyword extraction**: Split query into individual keywords
   - **Case-insensitive matching**
   - **Partial word matching**: "react" matches "React.js", "ReactJS"
   - **Highlight matched terms** in results

3. **Search Utilities** (`src/utilities/search.ts`)
   ```typescript
   // Search across all collections
   export async function searchPortfolio(query: string, filters?: SearchFilters)
   
   // Extract and highlight matched terms
   export function highlightMatches(text: string, query: string): string
   
   // Calculate relevance score
   export function calculateRelevanceScore(item: any, query: string): number
   
   // Extract popular search terms from analytics
   export function getPopularSearches(): string[]
   ```

4. **Performance Optimization**
   - Implement result caching (5-minute TTL)
   - Limit to 50 results per collection
   - Use Payload's efficient query operators
   - Add request rate limiting (10 requests/minute per IP)

### Phase 4D.2 — Search UI Components (User Interface)

**Status**: ✅ COMPLETED

**Implementation:**

1. **Header Search Button** (Top-right navigation)
   - Component: `SearchButton.tsx`
   - Label: **"Search Resume"** or **"Search My Work"**
   - Icon: Magnifying glass (🔍)
   - Behavior: Navigate to `/search` page
   - Placement: Top-right header, visible on all pages
   - Mobile: Responsive icon-only on small screens

2. **Homepage Search Section** (Below hero or before Featured Work)
   - Component: `HomeSearchBar.tsx`
   - Design:
     ```
     Quick Search
     [ Search React, Next.js, Laravel, WordPress, AI automation... ] [Search]
     
     Popular: React • Next.js • Laravel • WordPress • Python • AI • Certifications
     ```
   - Features:
     - Large rounded input with gradient border
     - Placeholder with example searches
     - Clickable popular search chips
     - Auto-focus on desktop
     - Routes to `/search?q=...`
   - Styling: Glass morphism, gradient accents, space theme

3. **Dedicated Search Page** (`/search`)
   - Component: `SearchPage.tsx` (Rainbow template)
   - Hero section:
     ```
     Search My Work
     Find projects, experience, certifications, and technical skills in one place.
     
     [ Search by React, Laravel, WordPress, AI, Python... ] [Search]
     ```
   - Features:
     - Starfield background animation
     - Large search input (auto-focused)
     - Filter tabs: All | Experience | Projects | Certifications
     - Sort dropdown: Most Relevant | Newest | Category
     - Result count display
     - Empty state with suggestions

4. **Search Results Component** (`SearchResults.tsx`)
   - Grouped results by type:
     - **Experience** cards
     - **Projects** cards
     - **Certifications** cards
   - Each card shows:
     - Title/Name (highlighted matches)
     - Subtitle (company/category/issuer)
     - Date range
     - Matched keywords highlighted
     - Relevance snippet
     - Link to full details
   - Responsive grid layout

### Phase 4D.3 — Search Results & Filtering (Core Functionality)

**Status**: ✅ COMPLETED

### Phase 4D.4 — Search Enhancements & Polish (April 5, 2026)

**Status**: ✅ COMPLETED

**Implementation:**

1. **Context-Aware Action Buttons**
   - Different button configurations based on content type:
     - **Experience**: Single "View Details" button linking to detail page
     - **Certifications**: "View Certificate" button (external credential link) with "View Details" fallback
     - **Projects**: "View Live Link" and/or "View Code" buttons (shows both if available)
   - Updated SearchResult interface with specific URL fields:
     - `liveUrl`: Project live site URL
     - `repoUrl`: Project repository URL  
     - `certificateUrl`: Certification credential URL
   - All external links use proper attributes: `target="_blank" rel="nofollow noopener noreferrer"`
   - Consistent design matching ProjectsPage button pattern

2. **Dynamic Tech Stack Suggestions**
   - Created `/api/tech-stack` endpoint:
     - Fetches all published projects from database
     - Extracts unique tech stacks from project `techStack` field
     - Sorts by usage frequency (most common first)
     - Returns top 8 technologies
   - SearchResults "No results" state shows dynamic suggestions:
     - Replaces hardcoded tech stack array
     - Updates automatically when projects change
     - Clickable tags trigger instant search
   - Interactive search tags integrated with existing search functionality

3. **Search Performance & Quality Improvements**
   - Rate limiting increased to 120 requests/minute
   - Exponential backoff for automatic retry on rate limit errors
   - Whole word matching for improved precision:
     - "AI" only matches "AI", not "training" or "certification"
     - Regex word boundary matching
     - Special handling for common abbreviations
   - All results sorted by date (latest to oldest)
   - Date formatting: User-friendly "Month Day, Year" format
   - Full title display (removed truncation in search cards)

4. **Payload Admin Bar Complete Removal**
   - Deleted entire AdminBar component directory
   - Created PayloadAdminRemover component:
     - Actively removes admin bar elements from DOM
     - Runs immediately on mount and periodically (100ms interval)
     - Uses MutationObserver to catch dynamically injected elements
     - Removes admin bar scripts, styles, and DOM elements
     - Preserves rainbow-header elements
   - CSS cleanup: Removed 100+ lines of admin bar hiding rules
   - Production ready: No Payload branding visible to visitors

5. **TypeScript & Code Quality**
   - Fixed type errors: Proper type conversions (`String(exp.id)`, `String(project.id)`)
   - Removed `any` types: Replaced with proper `SearchResult[]` types
   - Clean imports: Removed unused imports and variables
   - Config fix: Updated Payload config reference
   - Zero lint warnings

**Files Created:**
- `src/app/api/tech-stack/route.ts` - Dynamic tech stack API endpoint
- `src/components/PayloadAdminRemover.tsx` - Client-side admin bar removal

**Files Modified:**
- `src/utilities/search.ts` - Added URL fields, fixed type errors
- `src/templates/rainbow/components/search/SearchResultCard.tsx` - Context-aware buttons
- `src/templates/rainbow/components/search/SearchResults.tsx` - Dynamic tech stack
- `src/templates/rainbow/SearchPage.tsx` - Added onSearch prop
- `src/app/api/search/route.ts` - Fixed TypeScript types
- `src/app/(frontend)/layout.tsx` - Added PayloadAdminRemover
- `src/templates/rainbow/components/Layout.css` - CSS cleanup
- `src/templates/rainbow/components/Header.tsx` - Updated search link text

**Files Deleted:**
- `src/components/AdminBar/` - Entire directory removed

**Production Impact:**
- Better search UX with context-appropriate actions
- Dynamic tech stack stays current with portfolio
- Interactive search suggestions improve discoverability
- Clean professional appearance (no admin branding)
- Improved TypeScript safety and code quality
- Better performance (removed unnecessary components)

**Implementation:**

1. **Result Cards Design**

   **Experience Card:**
   ```
   [Card with gradient header]
   Senior Full Stack Developer
   LogicMedia • Jan 2023 - Present
   
   Matched skills: React, Next.js, TypeScript, AI/ML
   "Built SaaS platform using React and Next.js with AI-powered features..."
   
   [View Details →]
   ```

   **Project Card:**
   ```
   [Card with gradient header]
   MeetLessons AI SaaS
   Full Stack Development • 2024
   
   Tech Stack: React • Next.js • OpenAI • Python
   "AI-powered lesson planning platform with OCR and automation..."
   
   [View Project →] [View Code →]
   ```

   **Certification Card:**
   ```
   [Card with gradient header]
   React Advanced Certification
   Meta • Issued: Jan 2024 • 15 hours
   
   Category: Frontend & JavaScript
   "Advanced React patterns, hooks, performance optimization..."
   
   [View Credential →]
   ```

2. **Filtering System**
   - Filter tabs (client-side):
     - All (default)
     - Experience only
     - Projects only
     - Certifications only
   - URL state management: `/search?q=react&type=projects`
   - Active filter styling with gradients

3. **Sorting Options**
   - Most Relevant (default): By relevance score
   - Newest: By date (descending)
   - Category: Grouped by category/type

4. **Highlight Matched Text**
   - Utility function: `highlightMatches(text, query)`
   - Wrap matched terms in `<mark>` tags
   - CSS styling: Yellow highlight with dark background
   - Case-insensitive matching

5. **Empty State**
   ```
   No results found for "xyz"
   
   Try searching for:
   • React or Next.js
   • Laravel or PHP
   • WordPress or Elementor
   • Python or AI
   • Certifications
   ```

### Phase 4D.4 — Search UX Enhancements (Advanced Features)

**Status**: Partially Completed

**Implementation:**

1. **URL State Management** ✅ COMPLETED
   - Query parameter: `/search?q=react`
   - Filter parameter: `/search?q=react&type=projects` (Planned)
   - Browser back/forward support ✅
   - Shareable search URLs ✅
   - Update URL on search without page reload ✅

2. **Autosuggest / Autocomplete**
   - Component: `SearchAutocomplete.tsx`
   - Show suggestions as user types (debounced 300ms)
   - Suggest from:
     - Popular searches
     - Tech stack keywords
     - Project titles
     - Certification names
   - Keyboard navigation (arrow keys, enter)
   - Max 5 suggestions

3. **Popular Searches**
   - Hardcoded initial list:
     ```typescript
     const POPULAR_SEARCHES = [
       'React', 'Next.js', 'Laravel', 'WordPress',
       'Python', 'AI', 'TypeScript', 'Certifications'
     ]
     ```
   - Display as clickable chips
   - Track clicks for analytics (future)

4. **Multi-Keyword Search**
   - Support: `react next seo`
   - Split by spaces
   - Match ANY keyword (OR logic)
   - Highlight all matched keywords

5. **Search Across All Fields**
   - Projects: title, description, summary, techStack, category
   - Experience: title, company, responsibilities, skills
   - Certifications: name, issuer, category, description

6. **Keyboard Shortcuts** (Optional - PRO LEVEL)
   - `⌘ + K` or `Ctrl + K`: Open search modal
   - Command palette style (like VS Code)
   - Floating modal with search
   - ESC to close

### Phase 4D.5 — Search SEO & Analytics

**Status**: Planned

**Implementation:**

1. **SEO Optimization**
   - `/search` page metadata:
     ```typescript
     export const metadata = {
       title: 'Search Portfolio | Allan Rivera',
       description: 'Search projects, experience, and certifications. Find React, Next.js, Laravel, WordPress, Python, and AI work.',
       robots: 'index, follow'
     }
     ```
   - Canonical URL
   - OpenGraph tags
   - JSON-LD structured data (SearchAction)

2. **Analytics Tracking** (Future)
   - Track search queries
   - Track popular searches
   - Track zero-result searches
   - Track click-through rates

### Technical Architecture

**File Structure:**
```
src/
├── app/
│   ├── (frontend)/
│   │   └── search/
│   │       └── page.tsx          # Search page
│   └── api/
│       └── search/
│           └── route.ts           # Search API endpoint
├── templates/
│   └── rainbow/
│       ├── SearchPage.tsx         # Rainbow template search page
│       ├── components/
│       │   ├── search/
│       │   │   ├── SearchBar.tsx
│       │   │   ├── SearchButton.tsx
│       │   │   ├── SearchResults.tsx
│       │   │   ├── SearchFilters.tsx
│       │   │   ├── SearchAutocomplete.tsx
│       │   │   ├── ExperienceCard.tsx
│       │   │   ├── ProjectCard.tsx
│       │   │   └── CertificationCard.tsx
│       │   └── HomeSearchBar.tsx  # Homepage search section
└── utilities/
    └── search.ts                  # Search utilities
```

**Dependencies:**
- No new dependencies required
- Use existing: Payload Local API, Next.js, React, Tailwind CSS

### Implementation Priority

**Phase 1 (MVP - Week 1):**
1. Search API endpoint (`/api/search`)
2. Basic search utilities
3. Dedicated search page (`/search`)
4. Search results display (grouped by type)
5. Header search button

**Phase 2 (Enhanced - Week 2):**
1. Homepage search section
2. Filter tabs (All/Experience/Projects/Certifications)
3. Highlight matched text
4. URL state management
5. Empty state with suggestions

**Phase 3 (Advanced - Week 3):**
1. Autosuggest/autocomplete
2. Popular searches
3. Multi-keyword search
4. Sort options
5. SEO optimization

**Phase 4 (Optional - Future):**
1. Keyboard shortcuts (⌘ + K)
2. Analytics tracking
3. Search history
4. Advanced filters (date range, category)

### Success Metrics

- **Discoverability**: Search button visible in header on all pages
- **Usability**: Average time to find relevant content < 10 seconds
- **Completeness**: Search covers 100% of portfolio content
- **Performance**: Search results load in < 500ms
- **UX**: Zero-result rate < 10%

### Best Practices Applied

✅ **Recruiter-focused**: Search is a serious portfolio tool, not a hidden utility  
✅ **Multi-entry points**: Header button + homepage section + dedicated page  
✅ **Grouped results**: Experience, Projects, Certifications clearly separated  
✅ **Highlighted matches**: Matched keywords visually emphasized  
✅ **URL state**: Shareable search URLs for bookmarking  
✅ **Empty state**: Helpful suggestions when no results found  
✅ **Performance**: Cached results, rate limiting, efficient queries  
✅ **SEO**: Indexable search page with proper metadata  
✅ **Accessibility**: Keyboard navigation, ARIA labels, semantic HTML  

## Phase 4E — Performance Optimization for AI Chat & Booking UI (Best Practices)

Goal: Prepare the site for high-performance AI chat and booking interfaces with optimal Lighthouse scores and fast user interactions.

### **Performance Foundation (Completed 2026-04-02)**
- **Mobile Starfield Disabled**: No animation on mobile devices for better performance ✅
  - User agent + viewport width detection
  - Pure black background on mobile (no canvas rendering)
  - Eliminates 4,300 particle animation overhead
  - Better battery life and CPU usage
- **Gradient Backgrounds Removed**: All CSS gradients eliminated ✅
  - Removed 5 radial gradients + 1 linear gradient from Hero
  - Removed 30+ star gradient pseudo-elements
  - Pure black background for instant loading
  - Faster First Contentful Paint (FCP)
- **Pure Black Body Background**: Instant visual feedback ✅
  - `bg-black` class on `<body>` element
  - No flash of white on page load
  - Cleaner initial render

### **Recommended Optimizations for AI Chat & Booking UI**

#### **1. Code Splitting & Lazy Loading**
```typescript
// Lazy load heavy chat/booking components
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  loading: () => <div className="h-16 w-16 bg-gray-800 animate-pulse rounded-lg" />,
  ssr: false // Client-side only for real-time features
})

const BookingFlow = dynamic(() => import('@/components/BookingFlow'), {
  ssr: false // Booking requires client-side state
})

// Lazy load AI features
const AIAssistant = dynamic(() => import('@/components/AIAssistant'), {
  loading: () => <ChatLoadingSkeleton />,
  ssr: false
})
```

**Benefits:**
- Reduces initial bundle size by 40-60%
- Faster Time to Interactive (TTI)
- Better Core Web Vitals scores
- Chat/booking code only loads when needed

#### **2. Resource Preloading**
```typescript
// In layout.tsx <head>
<link rel="preload" href="/api/chat" as="fetch" crossOrigin="anonymous" />
<link rel="preload" href="/api/availability" as="fetch" crossOrigin="anonymous" />
<link rel="dns-prefetch" href="https://api.openai.com" />
<link rel="preconnect" href="https://api.stripe.com" crossOrigin />
```

**Benefits:**
- Faster API response times
- Reduced latency for chat/booking
- Better perceived performance

#### **3. API Route Optimization**
```typescript
// Cache availability data with ISR
export const revalidate = 60 // 1 minute cache

// Streaming responses for chat
export async function POST(request: Request) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Stream AI responses chunk by chunk
      for await (const chunk of aiResponse) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    }
  })
  return new Response(stream)
}
```

**Benefits:**
- Real-time chat responses
- Reduced server costs with caching
- Better UX with streaming

#### **4. State Management Best Practices**
```typescript
// Use SWR for real-time data fetching
import useSWR from 'swr'

function BookingCalendar() {
  const { data, error, mutate } = useSWR('/api/availability', fetcher, {
    refreshInterval: 30000, // Refresh every 30s
    revalidateOnFocus: true,
    dedupingInterval: 5000
  })
}

// Or React Query for complex state
const { data, isLoading } = useQuery({
  queryKey: ['availability', date],
  queryFn: fetchAvailability,
  staleTime: 60000, // 1 minute
  cacheTime: 300000 // 5 minutes
})
```

**Benefits:**
- Automatic background revalidation
- Optimistic updates
- Better error handling
- Reduced API calls

#### **5. Image Optimization**
```typescript
// Use Next.js Image with priority for above-fold
<Image 
  src="/chat-avatar.jpg" 
  priority 
  quality={75} // Balance quality vs size
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  width={48}
  height={48}
/>

// Lazy load below-fold images
<Image 
  src="/booking-calendar.png"
  loading="lazy"
  quality={80}
/>
```

**Benefits:**
- Faster LCP (Largest Contentful Paint)
- Reduced bandwidth usage
- Better mobile performance

#### **6. Service Worker & PWA**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.openai\.com/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'ai-chat-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300 // 5 minutes
        }
      }
    }
  ]
})
```

**Benefits:**
- Offline booking form caching
- Faster repeat visits
- Better mobile experience
- App-like feel

#### **7. Database Query Optimization**
```typescript
// Use Payload Local API with selective fields
const availability = await payload.find({
  collection: 'timeSlots',
  where: {
    startAt: { greater_than: new Date() },
    active: { equals: true }
  },
  select: {
    startAt: true,
    endAt: true,
    capacity: true
  },
  limit: 30,
  sort: 'startAt'
})

// Index frequently queried fields
{
  name: 'timeSlots',
  indexes: [
    { fields: ['startAt', 'active'] },
    { fields: ['endAt'] }
  ]
}
```

**Benefits:**
- Faster database queries
- Reduced memory usage
- Better scalability

#### **8. WebSocket for Real-Time Chat**
```typescript
// Use WebSocket for bidirectional communication
import { Server } from 'socket.io'

export default function handler(req, res) {
  if (res.socket.server.io) {
    res.end()
    return
  }

  const io = new Server(res.socket.server)
  res.socket.server.io = io

  io.on('connection', (socket) => {
    socket.on('chat-message', async (msg) => {
      const response = await getAIResponse(msg)
      socket.emit('ai-response', response)
    })
  })

  res.end()
}
```

**Benefits:**
- Real-time bidirectional communication
- Lower latency than polling
- Better UX for chat

#### **9. Error Boundaries & Fallbacks**
```typescript
// Wrap chat/booking in error boundaries
<ErrorBoundary 
  fallback={<ChatErrorFallback />}
  onError={(error) => logToSentry(error)}
>
  <ChatWidget />
</ErrorBoundary>

// Graceful degradation
function ChatWidget() {
  const [hasError, setHasError] = useState(false)
  
  if (hasError) {
    return <ContactFormFallback />
  }
  
  return <AIChat onError={() => setHasError(true)} />
}
```

**Benefits:**
- Better error handling
- Graceful degradation
- Improved user experience

#### **10. Analytics & Monitoring**
```typescript
// Track performance metrics
import { sendToAnalytics } from '@/lib/analytics'

useEffect(() => {
  // Track chat engagement
  sendToAnalytics('chat_opened', {
    timestamp: Date.now(),
    page: window.location.pathname
  })
  
  // Track booking funnel
  sendToAnalytics('booking_step', {
    step: 'calendar_view',
    duration: performance.now()
  })
}, [])

// Monitor Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**Benefits:**
- Data-driven optimization
- Identify bottlenecks
- Track conversion funnel

### **Expected Performance Targets**

#### **Lighthouse Scores**
- **Mobile**: 95-98 (no starfield overhead)
- **Desktop**: 96-99 (optimized loading)

#### **Core Web Vitals**
- **FCP** (First Contentful Paint): < 0.8s
- **LCP** (Largest Contentful Paint): < 1.2s
- **FID** (First Input Delay): < 50ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 2.0s

#### **API Performance**
- **Chat Response**: < 500ms (first chunk)
- **Availability Query**: < 200ms
- **Booking Submission**: < 1000ms

### **Implementation Priority**

1. **High Priority** (Immediate)
   - Code splitting for chat/booking components ✅
   - API route caching with ISR ✅
   - Mobile starfield disabled ✅
   - Pure black background ✅

2. **Medium Priority** (Next Sprint)
   - WebSocket for real-time chat
   - Service Worker & PWA setup
   - Database query optimization
   - Error boundaries

3. **Low Priority** (Future Enhancement)
   - Advanced analytics
   - A/B testing framework
   - Performance monitoring dashboard

Status: Foundation Complete, Ready for Implementation

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

## Phase 10 - Professional Animation System (Baunfire-Inspired)

Status: **Completed** (2026-04-17 — full site coverage)

### Inspiration & Analysis
- **Reference**: Baunfire.com - Award-winning digital agency website
- **Key Patterns**: Smooth fade-ins, staggered reveals, professional timing
- **Animation Library**: Framer Motion (already integrated)
- **Performance Target**: Maintain 99/91 Lighthouse scores

### Implementation Strategy

#### Phase 10A - Hero Section Overhaul
- **Text Reveal**: Word-by-word animation for headline
- **Staggered Content**: Badge (0.3s) + Headline (0.5s) + Description (1.2s) + CTA (1.5s) + Search (1.8s)
- **Apple-Style Easing**: `[0.22, 1, 0.36, 1]` curves
- **Accessibility**: Respects `prefers-reduced-motion`

#### Phase 10B - Scroll-Triggered Animations ✅ COMPLETED
- **Progressive Reveal**: Sections fade up from bottom
- **Scale Effects**: Subtle scale from 0.95 to 1.0
- **Intersection Observer**: `-100px` margin trigger
- **Performance**: GPU-accelerated transforms only
- **Edge-Slide Animations**: Experience + Education cards slide from browser edge (left/right alternating)
- **`overflow-x-clip`**: Prevents horizontal scrollbar from 100vw slide animations without breaking `position: fixed`
- **Full Site Coverage**: All internal pages animated — AllProjectsPage, AllCertificationsPage, PricingPage, SearchPage, ContactPage, Certifications, Experience, Education sections

#### Phase 10C - Interactive Polish
- **Button States**: Scale 1.05 + shadow intensification
- **Card Hovers**: Subtle lift effect with shadow
- **Navigation**: Smooth underline morphing
- **Form Elements**: Focus states with transitions

### Technical Architecture

#### Custom Hooks
- `usePrefersReducedMotion()` - Hydration-safe accessibility detection
- `useScrollTrigger()` - Intersection Observer wrapper
- `useWordAnimation()` - Text reveal utilities

#### Component Structure
- `AnimatedSection` - Reusable scroll-trigger wrapper
- `AnimatedText` - Word/character reveal component
- `InteractiveButton` - Enhanced button with hover states
- `AnimatedCard` - Card with scroll animations

#### Performance Optimization
- **GPU Only**: Only animate transform and opacity
- **Will-change**: Add sparingly for complex animations
- **Debounce**: Scroll event optimization
- **Bundle Size**: Keep animations lightweight

### Animation Timeline

#### Homepage Load Sequence:
1. **0.0s**: Background elements fade in
2. **0.3s**: Badge appears (fade-up, y: 50px)
3. **0.5s**: Headline starts (word-by-word reveal)
4. **1.2s**: Description fades in (y: 30px)
5. **1.5s**: CTA buttons appear (scale: 0.9 to 1.0)
6. **1.8s**: Search bar fades in (y: 60px)

#### Scroll Animations:
- **Trigger**: `-100px` before element visible
- **Duration**: 0.6s (professional timing)
- **Stagger**: 0.1s between multiple elements
- **Once**: Animations trigger only once per session

### Success Metrics
- **Lighthouse**: Maintain 99+ Performance score
- **Core Web Vitals**: All green metrics
- **Bundle Size**: <250KB total JavaScript
- **Animation FPS**: Maintain 60fps throughout
- **Accessibility**: 100% accessibility score

### Implementation Priority

#### High Priority (Immediate Impact)
1. Hero section text animations
2. Scroll-triggered section reveals
3. Interactive button states
4. Performance optimization

#### Medium Priority (Enhancement)
1. Card hover effects
2. Navigation animations
3. Form interactions
4. Background effects

#### Low Priority (Polish)
1. Page transitions
2. Loading animations
3. Error states
4. Easter eggs

### Files to Create/Modify
- **New**: `docs/ANIMATION.md` - Complete animation specification
- **New**: `src/templates/rainbow/hooks/useScrollTrigger.ts`
- **New**: `src/templates/rainbow/hooks/useWordAnimation.ts`
- **New**: `src/templates/rainbow/components/AnimatedSection.tsx`
- **New**: `src/templates/rainbow/components/AnimatedText.tsx`
- **Modify**: `src/templates/rainbow/components/Hero.tsx` - Complete overhaul
- **Modify**: `src/templates/rainbow/AllProjectsPage.tsx` - Enhanced scroll animations
- **Modify**: `src/templates/rainbow/AllCertificationsPage.tsx` - Consistent animations

### Documentation
- **Animation Guide**: `docs/ANIMATION.md` with complete technical specification
- **Implementation Notes**: Performance considerations and best practices
- **Accessibility**: Reduced motion support and screen reader compatibility

### Implementation Results

#### Completed Features
- ✅ **Hero Section**: Word-by-word headline animation with professional timing
- ✅ **AnimatedText Component**: Reusable text reveal component with disabled prop
- ✅ **Custom Hooks**: useWordAnimation, useScrollTrigger, usePrefersReducedMotion
- ✅ **HeroReveal Component**: Reusable on-load stagger animation for page hero sections
- ✅ **ScrollReveal Component**: Reusable scroll-triggered animation with `direction` prop (`up` | `left` | `right`)
- ✅ **Edge-Slide Animations**: Experience + Education cards alternate left/right from browser edge
- ✅ **Full Site Coverage**: HeroReveal + ScrollReveal on all internal pages (AllProjectsPage, AllCertificationsPage, PricingPage, SearchPage, ContactPage) and homepage sections (Certifications, Experience, Education)
- ✅ **Hydration-Safe**: No SSR/client mismatches
- ✅ **Performance**: Maintains 99/91 Lighthouse scores (95+ on mobile)
- ✅ **Accessibility**: Full prefers-reduced-motion support
- ✅ **Mobile Optimization**: Animations disabled on screens < 768px for performance

#### Design Decisions
- **Homepage Focus**: Impressive macro-animations for first impression
- **Internal Pages**: Micro-interactions only (performance-first approach)
- **Best Practice**: Different animation strategies for different page purposes
- **User Intent**: Content pages prioritize scannability over animation

#### Performance Metrics
- ✅ **Lighthouse Desktop**: 99 Performance score maintained
- ✅ **Lighthouse Mobile**: 95+ Performance score (improved from 82)
- ✅ **Animation FPS**: 60fps on desktop
- ✅ **Mobile Performance**: Zero animation overhead (animations disabled)
- ✅ **Bundle Size**: <250KB total JavaScript
- ✅ **GPU-Accelerated**: Only transform and opacity animated (desktop only)

#### Bug Fixes
- ✅ **FOUC Fix (2026-04-24)**: Eliminated animation flash-of-unstyled-content on Vercel
  - Root cause: `InitTheme` (`strategy="beforeInteractive"`) sets `data-theme` on `<html>` before React runs, triggering `html[data-theme] { opacity: initial }` and revealing fully-rendered content before Framer Motion initializes
  - Fix 1: Added `.will-animate { opacity: 0 }` CSS rule in `globals.css` (desktop only via `@media (min-width: 768px)`) — hides animated elements before any script runs; Framer Motion's inline styles override it automatically
  - Fix 2: Changed `initial` from string `"hidden"` to object form (e.g. `{ opacity: 0 }`) in both `HeroReveal` and `ScrollReveal` — object form is serialized to inline styles in SSR HTML, string form requires variant lookup at runtime
  - Files: `src/templates/rainbow/components/HeroReveal.tsx`, `src/templates/rainbow/components/ScrollReveal.tsx`, `src/app/(frontend)/globals.css`

#### Future Enhancements (Optional)
- Micro-interactions: Button hover states (scale 1.05 + shadow)
- Micro-interactions: Card hover effects (lift + shadow)
- Micro-interactions: Navigation underline morphing
- Page transitions: Smooth route changes (low priority)

---

## Phase 4C.12 — Coupon Codes & Promotional Discounts

**Status**: Planned

**Goal**: Let clients apply a discount code at checkout. Coupons are created in the Stripe Dashboard (source of truth for amounts/percentages) and optionally mirrored in Payload admin for display/management. A valid code reduces the Stripe Checkout total automatically.

---

### Why Stripe Is the Source of Truth

Stripe natively supports Coupons and Promotion Codes. When you pass a promotion code to a Checkout Session, Stripe validates it, applies the discount, and records everything on the payment — no custom math needed. The app should never compute discounts itself.

| Concept | What It Is | Where Managed |
|---------|-----------|--------------|
| **Coupon** | The discount rule (e.g. "20% off" or "$50 off") | Stripe Dashboard |
| **Promotion Code** | The human-readable code tied to a Coupon (e.g. `LAUNCH20`) | Stripe Dashboard |
| **Redemption** | Tracked automatically by Stripe per code use | Stripe Dashboard |
| **Mirror record** | Optional Payload record for admin visibility / display | Payload admin |

---

### User Flow

```
Client on /pricing page
        |
Sees optional "Have a promo code?" input (or enters it at Stripe Checkout)
        |
Proceeds to checkout -> Stripe Checkout applies the discount automatically
        |
Stripe Checkout total reflects discount
        |
Payment confirmed -> webhook -> booking marked paid (discounted amount stored)
```

Two UX options — pick one or both:

**Option A — Let Stripe handle it at checkout (simplest)**
- Pass `allow_promotion_codes: true` on the Checkout Session
- Client sees a "Add promo code" field natively in Stripe Checkout UI
- Zero extra code required beyond one flag

**Option B — Pre-validate on your site (better UX)**
- Add a promo code input to the BookingFlow `confirm` step
- Call `/api/bookings/validate-promo?code=LAUNCH20` before redirecting to Stripe
- If valid, show the discounted price preview
- Pass `discounts: [{ promotion_code: promoCodeId }]` to the Checkout Session

Option B is recommended for a premium feel. It gives clients instant feedback before they leave your site.

---

### Phase 4C.12.1 — Stripe Setup

**Steps to create a coupon + promotion code in Stripe:**

1. Go to **Stripe Dashboard → Products → Coupons**
2. Click **+ Create coupon**
3. Choose type:
   - **Percentage off**: e.g. 20% off (good for first-client discounts)
   - **Fixed amount off**: e.g. $50 off (good for referral credits)
4. Set redemption limits:
   - **Max redemptions**: e.g. 10 (prevents unlimited use)
   - **Expires**: optional date
   - **Applies to**: all products or specific packages
5. Click **Save**
6. Click the coupon → **Add promotion code**
7. Set the code string: e.g. `LAUNCH20`, `REFERRAL50`
8. Click **Save**
9. Copy the **Promotion Code ID** (starts with `promo_...`) for use in API calls

**Best practices:**
- One coupon can have multiple promotion codes (e.g. per-client codes, all sharing the same discount rule)
- Set `max_redemptions: 1` on per-client codes to prevent sharing
- Use `customer` restriction in Stripe to limit a code to a specific email
- Test codes in test mode before go-live (test promo codes start with `promo_` in test mode)

---

### Phase 4C.12.2 — API Changes

#### New endpoint: `POST /api/bookings/validate-promo`

```typescript
// Input
{ code: string, packageSlug: string }

// Output (success)
{ valid: true, promoCodeId: string, discountType: 'percent' | 'amount', discountValue: number, finalAmount: number }

// Output (invalid)
{ valid: false, message: 'Invalid or expired promo code' }
```

Implementation:
1. Use Stripe API to find the promotion code by `code` string (list promotion codes, filter by `code`)
2. Check `active: true`, `expires_at` not passed, `max_redemptions` not reached
3. Return discount details — never trust client-computed amounts

#### Modified: `POST /api/bookings/checkout`

Add optional `promoCodeId` to request body. When present:

```typescript
// If pre-validated promo code provided, apply it directly
await stripe.checkout.sessions.create({
  ...,
  discounts: promoCodeId ? [{ promotion_code: promoCodeId }] : undefined,
  // OR: let Stripe show the promo field itself
  allow_promotion_codes: !promoCodeId,
})
```

Never pass both `discounts` and `allow_promotion_codes` — Stripe rejects that combination.

#### Modified: `src/app/api/webhooks/stripe/route.ts`

The `checkout.session.completed` event already captures `session.amount_total` — this is the final paid amount after discount. Store it:

```typescript
await payload.update({
  collection: 'bookings',
  id: Number(bookingId),
  data: {
    status: 'paid',
    amount: session.amount_total ?? booking.amount,  // discounted amount
    paidAt: new Date().toISOString(),
    stripePaymentIntentId: ...,
  },
})
```

---

### Phase 4C.12.3 — Payload Admin Integration (Optional Mirror)

Create a `coupons` collection in Payload so you can see and manage active codes from the admin panel without going to Stripe each time. This is a **display mirror only** — Stripe is always the source of truth.

**Collection: `coupons`**

```typescript
{
  fields: [
    { name: 'code', type: 'text', required: true, unique: true },          // e.g. LAUNCH20
    { name: 'stripePromoCodeId', type: 'text' },                           // promo_xxx
    { name: 'stripeCouponId', type: 'text' },                              // co_xxx
    { name: 'discountType', type: 'select', options: ['percent', 'amount'] },
    { name: 'discountValue', type: 'number' },                             // 20 for 20% or 5000 for $50
    { name: 'currency', type: 'text', defaultValue: 'usd' },
    { name: 'maxRedemptions', type: 'number' },
    { name: 'expiresAt', type: 'date' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'notes', type: 'textarea' },                                   // admin-only notes
  ],
  admin: { group: 'Booking', useAsTitle: 'code' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
}
```

**Sync approach:**
- Create the coupon in Stripe first, then manually add the mirror record in Payload
- Do NOT sync automatically from Payload → Stripe (Stripe is the authority)
- Optional: add a Payload button that calls Stripe API to fetch current redemption count for display

---

### Phase 4C.12.4 — UI Changes

#### BookingFlow (`/book/[packageId]` — Confirm step)

Add a promo code field in the confirm step before the "Proceed to Payment" button:

```tsx
{/* Promo Code */}
<div className="flex gap-2">
  <input
    type="text"
    placeholder="Promo code (optional)"
    value={promoCode}
    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
    className="..."
  />
  <button onClick={handleValidatePromo} disabled={!promoCode || isValidating}>
    {isValidating ? 'Checking...' : 'Apply'}
  </button>
</div>

{promoResult?.valid && (
  <p className="text-green-400">
    ✓ {promoResult.discountType === 'percent'
      ? `${promoResult.discountValue}% off applied`
      : `$${promoResult.discountValue / 100} off applied`}
    — New total: {formatCurrency(promoResult.finalAmount)}
  </p>
)}

{promoResult?.valid === false && (
  <p className="text-red-400">✗ {promoResult.message}</p>
)}
```

#### PricingPage (optional)

Add a note below the CTA on each package card:

```tsx
<p className="text-xs text-white/40 mt-2">Have a promo code? Enter it at checkout.</p>
```

---

### Phase 4C.12.5 — Environment Variables

No new env vars needed. Promo code validation uses the existing `STRIPE_SECRET_KEY`.

---

### Implementation Order (Recommended)

1. **Create coupons in Stripe Dashboard** (5 minutes) — no code needed
2. **Pass `allow_promotion_codes: true`** to Checkout Session — Option A, one-line change, ships immediately
3. **Build `/api/bookings/validate-promo`** — Option B pre-validation (better UX)
4. **Update BookingFlow UI** — add promo input field
5. **Update webhook handler** to store `session.amount_total` as the paid amount
6. **Create Payload `coupons` collection** — optional admin mirror

Steps 1-2 can go live immediately with zero UI changes. Steps 3-6 are enhancement iterations.

---

### Security Considerations

- **Always validate server-side** — never trust `discountValue` sent from client
- **Rate limit the validate-promo endpoint** (10 requests/minute/IP) to prevent code enumeration
- **Log all promo code redemptions** — Stripe does this automatically; mirror in Payload if needed
- **Set `max_redemptions`** on every code — unlimited codes are a liability
- **Use Stripe's `customer` restriction** for per-client codes (ties code to a specific email)

---

### Files to Create/Modify

**New Files:**
- `src/app/api/bookings/validate-promo/route.ts` — server-side promo code validation
- `src/collections/Coupons.ts` — Payload admin mirror collection (optional)

**Modified Files:**
- `src/app/api/bookings/checkout/route.ts` — pass `discounts` or `allow_promotion_codes`
- `src/app/api/webhooks/stripe/route.ts` — store `session.amount_total` as paid amount
- `src/templates/rainbow/components/BookingFlow.tsx` — promo code input UI
- `src/payload.config.ts` — register Coupons collection (if building the mirror)

---

## Phase 11 — Public Site Restructuring & Audience Split

**Spec:** `docs/superpowers/specs/2026-05-06-public-redesign-and-chatbot-design.md`
**Goal:** Collapse 11 public routes to 6, split employer vs client audiences, clean up Payload collections, and restructure the homepage for faster scanning.

### Sub-goals
- Two distinct landing pages: `/` (employer-first portfolio) and `/services` (client-facing storefront, replaces `/pricing`).
- Remove `/experience`, `/education`, `/certifications`, `/pricing`, `/search` as standalone routes; redirect to homepage sections or `/services`.
- Delete unused `default` template.
- Beef up `FeaturedWork` project cards with tech badges, live demo links, problem-solved blurbs.
- Add credibility strip to homepage (Lighthouse score badge, TypeScript badge, open source GitHub link).
- Inline Experience / Education / Certifications as compact homepage sections.
- Add dual-audience CTA block above footer.

### Route changes

| Route | Action |
|---|---|
| `/` | Restructure (new section order) |
| `/experience` | Remove → 308 redirect to `/#experience` |
| `/education` | Remove → 308 redirect to `/#education` |
| `/certifications` | Remove → 308 redirect to `/#certifications` |
| `/search` | Remove → 308 redirect to `/` |
| `/pricing` | Remove → 308 redirect to `/services` |
| `/services` | New (replaces `/pricing`) |
| `/projects`, `/project/[slug]` | Keep |
| `/contact`, `/book/[packageSlug]` | Keep |

### Payload cleanup

- **Delete** `default` template (`src/templates/default/`)
- **Investigate** `Companies` collection — convert to select field if < 20 entries
- **Investigate** `ResumeProfiles` collection vs `ResumeProfile` global — deduplicate
- **Remove** `Pages`, `Posts`, `Categories` if not actively used
- **Enforce admin-only access** on `Generations`, `JobAds`, `CoverLetterSettings`, `AIGenerationSettings`

### New env vars
None required for this phase.

### Acceptance criteria
- [ ] All old routes issue 308 redirects
- [ ] `/services` renders correctly with packages
- [ ] Homepage section order matches spec
- [ ] `default/` template directory removed
- [ ] Lighthouse desktop ≥ 97 after changes
- [ ] `pnpm exec tsc --noEmit` clean
- [ ] `pnpm lint` clean

---

## Phase 12 — Public AI Chatbot (Claude Haiku 4.5 + Telegram Alerts)

**Spec:** `docs/superpowers/specs/2026-05-06-public-redesign-and-chatbot-design.md`
**Goal:** Replace hero SearchBar with a working RAG chatbot grounded in Allan's Payload data. Private Telegram alerts for high-intent visitor conversations.

### Architecture summary
- **LLM:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via Anthropic SDK (server-only).
- **RAG strategy:** Full resume data (~7,500 tokens) injected into system prompt with Anthropic prompt caching. No vector DB — data is too small to justify embeddings.
- **Caching:** `cache_control: ephemeral` on system prompt block. ~90% cost reduction on repeated turns.
- **Streaming:** `ReadableStream` via Edge runtime. No Vercel AI SDK dependency.
- **Rate limiting:** Upstash Redis. 5 messages/session, 20/day per IP, 10K output tokens/session.
- **Bot protection:** Cloudflare Turnstile (invisible challenge) on every `/api/chat` request.
- **Notifications:** Telegram bot via HTTPS API (no SDK). Fires on high-intent signals.
- **Storage:** Two new Payload collections (`ChatSessions`, `ChatMessages`), admin-only.

### New collections

**`ChatSessions`** — `id`, `ipAddress`, `userAgent`, `startedAt`, `lastMessageAt`, `messageCount`, `leadStatus` (new/contacted/qualified/cold), `capturedEmail`, `capturedName`, `intentSignals[]`

**`ChatMessages`** — `id`, `session` → ChatSessions, `role` (user/assistant), `content`, `createdAt`, `tokenCount`

### High-intent signals (Telegram trigger)
- Pricing/hiring keywords in visitor message
- Visitor leaves email or phone number
- Conversation crosses 4 turns
- Rate-limit hit (visitor wanted more)

Telegram message format:
```
💬 New high-intent chat
Signal: pricing-question
Last msg: "What does the Starter package cost?"
Session: abc123 (8 msgs)
View → https://<site>/admin/collections/chat-sessions/abc123
```

### Performance rules (Lighthouse preservation)
1. Anthropic SDK server-only — never in client bundle
2. `Chat.tsx` lazy-loaded via `next/dynamic({ ssr: false })`, triggered on input focus
3. `/api/chat` uses Edge runtime
4. Streaming via plain `ReadableStream` (no AI SDK)
5. All non-chat sections remain Server Components
6. Pre-allocate chat container height to avoid CLS

### New files
- `src/app/api/chat/route.ts`
- `src/collections/ChatSessions.ts`
- `src/collections/ChatMessages.ts`
- `src/templates/rainbow/components/Chat.tsx`
- `src/lib/anthropic.ts`
- `src/lib/telegram.ts`
- `src/lib/rate-limit.ts`
- `src/lib/intent-classifier.ts`
- `docs/CHATBOT.md`
- `docs/TELEGRAM_ALERTS.md`

### Modified files
- `src/templates/rainbow/components/Hero.tsx` — replace SearchBar with chat input
- `src/templates/rainbow/HomePage.tsx` — import Chat lazily
- `src/payload.config.ts` — register new collections
- `src/payload-types.ts` — regenerate
- `.env.example` — new vars

### New env vars
```
ANTHROPIC_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Acceptance criteria
- [ ] Chatbot answers 10 manual questions across profile, projects, experience, certifications, services
- [ ] 6th message per session blocked with CTA card (not an error)
- [ ] 21st message per IP/day blocked
- [ ] Telegram alert fires on pricing question, email drop, rate-limit hit
- [ ] No Anthropic SDK in client bundle (verified via `next build --analyze`)
- [ ] Chat input visible on initial paint without chat module loaded
- [ ] Lighthouse desktop ≥ 97
- [ ] Integration test: `/api/chat` rate limiting
- [ ] Unit test: intent classifier
- [ ] `pnpm exec tsc --noEmit` clean
- [ ] `pnpm lint` clean
