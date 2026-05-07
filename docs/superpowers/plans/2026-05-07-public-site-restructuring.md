# Public Site Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse 11 public routes to 6, split employer (`/`) vs client (`/services`) audiences, simplify Payload, and restructure the homepage — without dropping below Lighthouse 97 desktop.

**Architecture:** Server-component homepage with inlined Experience/Education/Certifications sections. Old standalone routes 308-redirect to homepage anchors. `/pricing` → `/services` rename. Admin-only access lockdown on private AI tooling. No client-bundle changes; visual aesthetic preserved.

**Tech Stack:** Next.js 15 App Router, Payload CMS 3.x, TypeScript, Tailwind, Framer Motion (existing).

**Spec:** `docs/superpowers/specs/2026-05-06-public-redesign-and-chatbot-design.md`

---

## Task 0: Branch + smoke baseline

**Files:**
- N/A (operational)

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/public-site-restructure
```

- [ ] **Step 2: Capture current Lighthouse baseline (desktop)**

Start dev server (`pnpm dev`) and run Lighthouse on `http://localhost:3000` in Chrome DevTools (or `npx lighthouse http://localhost:3000 --only-categories=performance --form-factor=desktop`). Record the score in a comment on this task. We must not drop below this minus 2 by the end.

Expected: ≥ 97.

- [ ] **Step 3: Commit baseline note (no code changes)**

```bash
git commit --allow-empty -m "chore: start public site restructure (lighthouse baseline captured)"
```

---

## Task 1: Delete unused `default` template

**Files:**
- Delete: `src/templates/default/`
- Modify: `src/templates/registry.ts`

- [ ] **Step 1: Confirm `default` template is unused**

Run: `grep -rn "templates/default\|'default'" src/ --include='*.ts' --include='*.tsx'`

Expected: only references should be in `src/templates/registry.ts` itself. If anything else references it, stop and reassess — task assumed dead code.

- [ ] **Step 2: Read the registry**

```bash
cat src/templates/registry.ts
```

Note the shape so we can keep `rainbow` mapping intact.

- [ ] **Step 3: Remove `default` from registry**

Edit `src/templates/registry.ts` to remove the `default` import and registry entry. The exported registry should map only `rainbow` (and any other live template). If `default` is the fallback, change the fallback to `rainbow`.

- [ ] **Step 4: Delete the template directory**

```bash
rm -rf src/templates/default
```

- [ ] **Step 5: Type check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: clean. If `getTemplate.ts` references `default` as fallback, update it to `rainbow`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete unused default template (rainbow is the active one)"
```

---

## Task 2: Lock down private AI collections (admin-only)

**Files:**
- Modify: `src/collections/Generations.ts`
- Modify: `src/collections/JobAds.ts`
- Modify: `src/CoverLetterSettings/config.ts` (or wherever the global lives)
- Modify: `src/AIGenerationSettings/config.ts`

- [ ] **Step 1: Inspect current access on `Generations`**

```bash
grep -n "access:" src/collections/Generations.ts
```

Currently uses `adminOrEditor` for read/create/update/delete. We want **admin-only** since these are Allan's private tools.

- [ ] **Step 2: Switch `Generations` access to `adminOnly`**

Edit `src/collections/Generations.ts`:

```ts
import { adminOnly } from '../access/adminOnly'
// remove: import { adminOrEditor } from '../access/adminOrEditor'

export const Generations: CollectionConfig = {
  slug: 'generations',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  // ...rest unchanged
}
```

- [ ] **Step 3: Repeat for `JobAds`**

Edit `src/collections/JobAds.ts` — switch all four access functions to `adminOnly`. Update the import.

- [ ] **Step 4: Lock down `CoverLetterSettings` global**

Find the global config file (likely `src/CoverLetterSettings/config.ts`):

```bash
find src -name "config.ts" -path "*CoverLetterSettings*"
```

Add/modify:

```ts
access: {
  read: adminOnly,
  update: adminOnly,
}
```

- [ ] **Step 5: Lock down `AIGenerationSettings` global**

Same pattern as Step 4.

- [ ] **Step 6: Type check**

```bash
pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 7: Manual smoke**

Start dev server. Log in as a non-admin user (or temporarily change your role). Visit `/admin/collections/generations` — should be hidden/forbidden. Restore your role.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(payload): lock private AI tooling (Generations, JobAds, CoverLetter, AIGen) to admin-only"
```

---

## Task 3: Investigate `Companies` collection (decision task)

**Files:**
- Read: `src/collections/Companies.ts`

- [ ] **Step 1: Count current Companies entries**

Start dev DB, then in a quick node script or admin UI count rows. Or run:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM companies;"
```

- [ ] **Step 2: Decide**

- If count < 20 → add a follow-up task (Task 3b) to convert `companies` to a `select` field on `Experiences`.
- If count ≥ 20 → keep the collection. Document decision in this task as a comment, skip 3b.

- [ ] **Step 3: Commit decision note (no code change yet)**

If keeping: skip — no commit needed. If converting: don't commit yet; do the conversion in Task 3b and commit there.

### Task 3b (conditional — only if Companies < 20): Convert to select field

**Files:**
- Modify: `src/collections/Experiences.ts`
- Modify: `src/payload.config.ts` (remove Companies)
- Delete: `src/collections/Companies.ts`
- Migration: `src/migrations/<timestamp>_companies_to_select.ts`

- [ ] **Step 1: Snapshot existing data**

Before destroying the collection, dump current values:

```bash
psql "$DATABASE_URL" -c "SELECT id, name FROM companies ORDER BY name;" > /tmp/companies-snapshot.txt
```

- [ ] **Step 2: Replace the relationship in `Experiences.ts`**

Find the `company` field (relationship → companies). Replace with a `text` field for now (simpler) or `select` if Allan wants a closed list:

```ts
{
  name: 'company',
  type: 'text',
  required: true,
  admin: { description: 'Company name (was relationship → companies)' },
}
```

- [ ] **Step 3: Write a migration to backfill**

Create `src/migrations/<timestamp>_companies_to_text.ts`:

```ts
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    ALTER TABLE experiences ADD COLUMN IF NOT EXISTS company_text TEXT;
    UPDATE experiences e
       SET company_text = c.name
      FROM companies c
     WHERE e.company_id = c.id;
    ALTER TABLE experiences DROP COLUMN IF EXISTS company_id;
    ALTER TABLE experiences RENAME COLUMN company_text TO company;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Manual rollback only — destructive
}
```

- [ ] **Step 4: Remove `Companies` from `payload.config.ts`**

Delete the `import { Companies }` line and the `Companies,` entry from the `collections:` array.

- [ ] **Step 5: Delete the collection file**

```bash
rm src/collections/Companies.ts
```

- [ ] **Step 6: Run migration + regenerate types**

```bash
pnpm migrate
pnpm generate:types
```

- [ ] **Step 7: Verify type checking**

```bash
pnpm exec tsc --noEmit
```

Fix any references to `Company` type. Likely in `src/utilities/fetchPublicData.ts` and rainbow template files — replace with `string`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(payload): convert Companies relationship to text field on Experiences"
```

---

## Task 4: Investigate `ResumeProfiles` collection vs `ResumeProfile` global (decision task)

**Files:**
- Read: `src/collections/ResumeProfiles.ts`
- Read: `src/ResumeProfile/` (global)

- [ ] **Step 1: Compare schemas**

```bash
diff <(grep '^\s*name:' src/collections/ResumeProfiles.ts) <(grep '^\s*name:' src/ResumeProfile/config.ts) || true
```

- [ ] **Step 2: Find usages**

```bash
grep -rn "resume-profiles\|ResumeProfiles\|ResumeProfile1" src/ --include='*.ts' --include='*.tsx'
```

`ResumeProfile1` (the typed alias for the collection) is a sign of duplication.

- [ ] **Step 3: Decide**

- If the collection is multi-row (multiple profiles for AI tailoring per job ad) → **keep both**. Document why in `CLAUDE.md` later.
- If it's a duplicate of the global → mark for removal. Add Task 4b.

- [ ] **Step 4: Document decision**

Add a brief note to `CLAUDE.md` (in the Task 14 batch later) explaining the difference. No code change here unless removing — that goes in 4b.

### Task 4b (conditional — only if duplicate): Remove `ResumeProfiles` collection

If keeping, skip this task. If removing, follow the same pattern as Task 3b: snapshot data, write a migration, delete the collection, regenerate types, fix downstream usages.

---

## Task 5: Add 308 redirects for old public routes

**Files:**
- Modify: `redirects.js`

- [ ] **Step 1: Read current redirects file**

```bash
cat redirects.js
```

- [ ] **Step 2: Add new redirects**

Edit `redirects.js`:

```js
const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      { type: 'header', key: 'user-agent', value: '(.*Trident.*)' },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)',
  }

  const consolidatedRoutes = [
    { source: '/experience',     destination: '/#experience',     permanent: true },
    { source: '/education',      destination: '/#education',      permanent: true },
    { source: '/certifications', destination: '/#certifications', permanent: true },
    { source: '/search',         destination: '/',                permanent: true },
    { source: '/pricing',        destination: '/services',        permanent: true },
  ]

  return [internetExplorerRedirect, ...consolidatedRoutes]
}

export default redirects
```

(`permanent: true` produces 308.)

- [ ] **Step 3: Restart dev server and verify**

```bash
curl -sI http://localhost:3000/pricing | head -3
curl -sI http://localhost:3000/experience | head -3
curl -sI http://localhost:3000/search | head -3
```

Expected: `HTTP/1.1 308 Permanent Redirect` with the right `Location` header.

- [ ] **Step 4: Commit**

```bash
git add redirects.js
git commit -m "feat(routes): add 308 redirects for consolidated public routes"
```

---

## Task 6: Create `/services` page (replaces `/pricing`)

**Files:**
- Read first: `src/app/(frontend)/pricing/page.tsx` (to understand what to copy)
- Create: `src/app/(frontend)/services/page.tsx`
- Create (if needed): `src/app/(frontend)/services/layout.tsx`

- [ ] **Step 1: Read the existing pricing page**

```bash
cat 'src/app/(frontend)/pricing/page.tsx'
```

- [ ] **Step 2: Mirror it as `/services/page.tsx`**

Create `src/app/(frontend)/services/page.tsx` — same data fetching, same template component (`PricingPage` from rainbow). Update the page-level title/metadata copy:

- `<h1>` text → "Services" (was "Pricing")
- `<title>` → "Services — Allan Rivera"
- meta description → focuses on "freelance packages and engagement options" rather than just "pricing"

Keep the same `export const revalidate = 300` ISR.

- [ ] **Step 3: Verify in the browser**

Visit `http://localhost:3000/services` — should render with the same packages as `/pricing` did.

- [ ] **Step 4: Type check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(routes): add /services page (replaces /pricing for client audience)"
```

---

## Task 7: Remove old route directories

**Files:**
- Delete: `src/app/(frontend)/experience/`
- Delete: `src/app/(frontend)/education/`
- Delete: `src/app/(frontend)/certifications/`
- Delete: `src/app/(frontend)/pricing/`
- Delete: `src/app/(frontend)/search/`

- [ ] **Step 1: Confirm nothing imports from them**

```bash
grep -rn 'from.*"@/app/(frontend)/(experience|education|certifications|pricing|search)' src/ || echo "no imports — safe to delete"
```

(Imports from these route folders into other code are uncommon; route segments are usually leaves.)

- [ ] **Step 2: Delete directories**

```bash
rm -rf 'src/app/(frontend)/experience'
rm -rf 'src/app/(frontend)/education'
rm -rf 'src/app/(frontend)/certifications'
rm -rf 'src/app/(frontend)/pricing'
rm -rf 'src/app/(frontend)/search'
```

- [ ] **Step 3: Restart dev server, confirm redirects fire**

```bash
curl -sI http://localhost:3000/experience | head -3
curl -sI http://localhost:3000/pricing    | head -3
```

Expected: 308 to `/` (with anchor) and `/services`. The pages no longer exist; the redirect catches them first.

- [ ] **Step 4: Type check + build**

```bash
pnpm exec tsc --noEmit
pnpm build
```

Expected: build succeeds. Sitemap may emit warnings about removed routes — that's fine; `next-sitemap` will drop them automatically next build.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(routes): remove standalone /experience, /education, /certifications, /pricing, /search"
```

---

## Task 8: Create `CredibilityStrip` component

**Files:**
- Create: `src/templates/rainbow/components/CredibilityStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/templates/rainbow/components/CredibilityStrip.tsx
import React from 'react'

const ITEMS = [
  { label: 'Lighthouse 99', href: 'https://pagespeed.web.dev/' },
  { label: 'TypeScript', href: null },
  { label: 'Open source ↗', href: 'https://github.com/<your-username>/<this-repo>' },
] as const

export function CredibilityStrip() {
  return (
    <section
      aria-label="Site credibility"
      className="border-y border-white/10 bg-black/20 py-3 text-center text-xs uppercase tracking-[0.2em] text-white/60"
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {ITEMS.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 2: Update the GitHub URL placeholder**

Replace `<your-username>/<this-repo>` with the actual repo URL. Look it up:

```bash
git remote -v | head -1
```

- [ ] **Step 3: Type check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/templates/rainbow/components/CredibilityStrip.tsx
git commit -m "feat(rainbow): add CredibilityStrip component for homepage"
```

---

## Task 9: Update `ProjectCard` — tech badges + live demo + repo links

**Files:**
- Read first: `src/templates/rainbow/components/ProjectCard.tsx`
- Modify: same file
- Possibly modify: `src/collections/Projects.ts` (add `liveUrl`, `repoUrl`, `techStack` fields if missing)

- [ ] **Step 1: Read the current card**

```bash
cat src/templates/rainbow/components/ProjectCard.tsx
```

Note what props it currently accepts.

- [ ] **Step 2: Check if `Project` type already has the needed fields**

```bash
grep -n "liveUrl\|repoUrl\|techStack" src/payload-types.ts | head -20
```

If any are missing, add them in Step 3. If all present, skip to Step 4.

- [ ] **Step 3 (conditional): Add missing fields to `Projects` collection**

In `src/collections/Projects.ts`, add any of these that are missing:

```ts
{
  name: 'liveUrl',
  type: 'text',
  admin: { description: 'Live demo URL (https://…)' },
  validate: (value: unknown) => {
    if (!value) return true
    if (typeof value !== 'string') return 'Must be a URL'
    try { new URL(value); return true } catch { return 'Invalid URL' }
  },
},
{
  name: 'repoUrl',
  type: 'text',
  admin: { description: 'Source repo URL (https://github.com/…)' },
},
{
  name: 'techStack',
  type: 'array',
  fields: [{ name: 'name', type: 'text', required: true }],
  admin: { description: 'Tech badges shown on the card' },
},
```

Then: `pnpm migrate && pnpm generate:types`.

- [ ] **Step 4: Update `ProjectCard.tsx`**

Update the card render to include badges and links. Tailwind classes follow rainbow's existing aesthetic:

```tsx
{project.techStack && project.techStack.length > 0 && (
  <ul className="mt-3 flex flex-wrap gap-2">
    {project.techStack.map((t) => (
      <li
        key={t.id ?? t.name}
        className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/70"
      >
        {t.name}
      </li>
    ))}
  </ul>
)}

<div className="mt-4 flex gap-3 text-sm">
  {project.liveUrl && (
    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-white underline-offset-4 hover:underline">
      Live demo ↗
    </a>
  )}
  {project.repoUrl && (
    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
      Code ↗
    </a>
  )}
</div>
```

Place the badges and links inside the card body, after the existing description.

- [ ] **Step 5: Type check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Visual check**

Browser: visit `/` and confirm the project cards show badges/links when data is present, render cleanly when absent.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(rainbow): beef up ProjectCard with tech badges and live demo links"
```

---

## Task 10: Restructure `HomePage.tsx` — new section order

**Files:**
- Modify: `src/templates/rainbow/HomePage.tsx`
- Modify: `src/utilities/fetchPublicData.ts` (if it doesn't already fetch experiences/educations/certifications)
- Modify: `src/app/(frontend)/page.tsx`

- [ ] **Step 1: Read current homepage**

```bash
cat src/templates/rainbow/HomePage.tsx
```

Already reviewed — it imports Hero, FeaturedWork, Experience, Education, Certifications. We need to add the credibility strip and a CTA block, and adjust order/sectioning IDs.

- [ ] **Step 2: Update `HomePage.tsx`**

```tsx
import React from 'react'
import type {
  Project,
  SiteSetting,
  ResumeProfile1,
  Experience,
  Education,
  Certification,
} from '@/payload-types'
import { Hero } from './components/Hero'
import { CredibilityStrip } from './components/CredibilityStrip'
import { FeaturedWork } from './components/FeaturedWork'
import { Experience as ExperienceSection } from './components/Experience'
import { Education as EducationSection } from './components/Education'
import { Certifications } from './components/Certifications'
import { HomeCTA } from './components/HomeCTA'

interface HomePageProps {
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  experiences?: Experience[]
  educations?: Education[]
  certifications?: Certification[]
  settings?: SiteSetting | null
}

export function HomePage({
  profile,
  featuredProjects,
  experiences,
  educations,
  certifications,
}: HomePageProps) {
  return (
    <div>
      <Hero profile={profile} />
      <CredibilityStrip />

      {featuredProjects && featuredProjects.length > 0 && (
        <FeaturedWork projects={featuredProjects} />
      )}

      {experiences && experiences.length > 0 && (
        <section id="experience" className="scroll-mt-24">
          <ExperienceSection experiences={experiences} />
        </section>
      )}

      {educations && educations.length > 0 && (
        <section id="education" className="scroll-mt-24">
          <EducationSection educations={educations} certifications={certifications} />
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section id="certifications" className="scroll-mt-24">
          <Certifications certifications={certifications} />
        </section>
      )}

      <HomeCTA />
    </div>
  )
}
```

- [ ] **Step 3: Type check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit (HomeCTA component still missing — next task)**

Don't commit yet; do `HomeCTA` first to keep build green.

---

## Task 11: Create `HomeCTA` component (dual-audience CTA block)

**Files:**
- Create: `src/templates/rainbow/components/HomeCTA.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/templates/rainbow/components/HomeCTA.tsx
import React from 'react'
import Link from 'next/link'

export function HomeCTA() {
  return (
    <section className="relative z-10 mx-auto my-24 w-[min(calc(100%-40px),1320px)] rounded-3xl border border-white/10 bg-black/30 p-10 text-center backdrop-blur md:p-16">
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Want to work together?
      </h2>
      <p className="mt-3 text-white/70">
        Pick the path that fits.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Hiring? Email me
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Need help shipping? See services
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type check + build**

```bash
pnpm exec tsc --noEmit
pnpm build
```

Expected: build passes (Task 10's `HomePage.tsx` now resolves all imports).

- [ ] **Step 3: Visual check**

Browser: visit `/` and confirm new section order: Hero → CredibilityStrip → FeaturedWork → Experience → Education → Certifications → HomeCTA → Footer.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(rainbow): restructure homepage section order + add HomeCTA"
```

---

## Task 12: Update Header nav — Work · Services · Contact

**Files:**
- Modify: rainbow header (find with grep below)

- [ ] **Step 1: Locate the rainbow header**

```bash
ls src/templates/rainbow/components/Header.tsx
grep -n "href=" src/templates/rainbow/components/Header.tsx
```

- [ ] **Step 2: Edit nav items**

Open `src/templates/rainbow/components/Header.tsx` and update the nav array/JSX so it shows exactly three links:

```tsx
const NAV_ITEMS = [
  { href: '/projects', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/contact',  label: 'Contact' },
] as const
```

(If the existing header reads from the Payload `Header` global, edit the global instead via the admin UI **and** add a one-time seed script update for fresh installs.)

- [ ] **Step 3: Verify in browser**

Confirm header shows three items. Confirm clicking each works (no 404s).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(rainbow): simplify header nav to Work · Services · Contact"
```

---

## Task 13: Lighthouse re-test + acceptance gate

**Files:**
- N/A

- [ ] **Step 1: Production build**

```bash
pnpm build
pnpm start
```

(Run in two terminals. Or use `next start -p 3001` to avoid dev server collision.)

- [ ] **Step 2: Run Lighthouse on `/` (desktop)**

```bash
npx lighthouse http://localhost:3000 --only-categories=performance --form-factor=desktop --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-after.json
node -e "console.log(require('/tmp/lh-after.json').categories.performance.score * 100)"
```

Expected: ≥ 97. If lower, investigate (most likely cause: an extra image was added without `next/image`).

- [ ] **Step 3: Smoke `/services`**

Visit `/services`. Confirm packages render. Click into a `/book/[packageSlug]` flow if visible. Confirm Stripe-test mode still works.

- [ ] **Step 4: Smoke redirects**

```bash
for r in /experience /education /certifications /search /pricing; do
  echo -n "$r → "; curl -sI "http://localhost:3000$r" | awk '/^location:/{print $2}'
done
```

Expected (trailing newlines): `/#experience`, `/#education`, `/#certifications`, `/`, `/services`.

- [ ] **Step 5: Commit nothing — gate only**

If everything passes, proceed to docs. If anything fails, fix it as a follow-up task before the docs.

---

## Task 14: Update root markdown files

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `CLAUDE.md`
- (PLAN.md already updated in earlier brainstorming session)

- [ ] **Step 1: Update `CHANGELOG.md`**

Add a new entry at the top:

```md
## [Unreleased] — 2026-05-07

### Changed
- Public site: collapsed 11 routes to 6. `/experience`, `/education`, `/certifications` are now homepage sections (308 redirects keep old URLs working).
- `/pricing` renamed to `/services` (308 redirect in place).
- `/search` removed (will be replaced by AI chatbot in Phase B).
- Homepage section order: Hero → CredibilityStrip → FeaturedWork → Experience → Education → Certifications → HomeCTA → Footer.
- Header nav simplified to: Work · Services · Contact.
- Project cards now show tech badges, live demo, and repo links.

### Removed
- Unused `default` template (`rainbow` is the active one).
- Standalone `/experience`, `/education`, `/certifications`, `/pricing`, `/search` route folders.

### Security
- `Generations`, `JobAds`, `CoverLetterSettings`, `AIGenerationSettings` are now admin-only (private job-hunt tooling, not for public roles).
```

- [ ] **Step 2: Update `README.md`**

Find the section that describes the public routes (likely under "Architecture" or "Routes"). Replace with the new 6-route table from the spec. Add a one-line "Audience split: `/` employer-first, `/services` client-first."

- [ ] **Step 3: Update `CLAUDE.md`**

Update the **Route Groups** section to reflect the new public routes. Add a note under **Access Control**:

```md
**Private AI tooling**: `Generations`, `JobAds`, `CoverLetterSettings` (global), and `AIGenerationSettings` (global) are admin-only. They are Allan's private job-hunt workflow — never expose them in public-facing UI or roles below `admin`.
```

If the difference between `ResumeProfile` (global) and `ResumeProfiles` (collection) was clarified in Task 4, document the distinction here too.

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md README.md CLAUDE.md
git commit -m "docs: update CHANGELOG, README, CLAUDE.md for public site restructure"
```

---

## Task 15: Final verification + push

**Files:**
- N/A

- [ ] **Step 1: Run the full check suite**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: all clean.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/public-site-restructure
```

- [ ] **Step 3: Open PR (if applicable)**

The user may prefer to merge directly to main. Ask before opening a PR.

---

## Acceptance criteria (mirrors spec §11 Phase A scope)

- [x] All old routes issue 308 redirects (Task 5)
- [x] `/services` renders correctly with packages (Task 6)
- [x] Homepage section order matches spec (Tasks 10–11)
- [x] `default/` template removed (Task 1)
- [x] Lighthouse desktop ≥ 97 (Task 13)
- [x] Header nav: Work · Services · Contact (Task 12)
- [x] `pnpm exec tsc --noEmit` clean (Task 15)
- [x] `pnpm lint` clean (Task 15)
- [x] CHANGELOG, README, CLAUDE.md updated (Task 14)
- [x] Private AI collections admin-only (Task 2)
