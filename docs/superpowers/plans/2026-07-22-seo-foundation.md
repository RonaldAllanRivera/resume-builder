# SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make allanai.dev fully indexable on one canonical host, remove Payload template branding from production metadata, and add analytics — so the site can be submitted to Google without indexing the wrong URLs.

**Architecture:** Repair Next.js App Router metadata routes (`robots.ts`, `sitemap.ts`) by moving them to the app root and deleting the dead parallel `next-sitemap` system. Then layer canonical URLs, structured data, and analytics on top. Everything resolves the site URL through a single new helper so the host can never drift again.

**Tech Stack:** Next.js 15 (App Router), Payload CMS 3.74, TypeScript, Vitest (integration tests against Postgres on port 5433), Vercel.

## Global Constraints

- Canonical host is **`https://www.allanai.dev`** — www, with protocol, no trailing slash. Every emitted URL uses it.
- **Never** add `searchParams`, `cookies()`, `headers()`, or `useSearchParams()` at the page level of `src/app/(frontend)/page.tsx` — it opts the homepage out of static rendering. (CLAUDE.md)
- Payload Local API calls that read user-visible content use `overrideAccess: false` so drafts never leak. (CLAUDE.md)
- In collection hooks, always pass `req` to nested Payload operations. (CLAUDE.md)
- `src/payload-types.ts` is auto-generated — never edit by hand.
- No test may make a live network call (no live Resend, no live PageSpeed, no live Anthropic).
- Integration tests live in `tests/int/**/*.int.spec.ts` and need `pnpm test:db:up` first.
- Pre-commit hook runs `pnpm lint` and `tsc --noEmit`; both must pass before every commit.
- `/projects` and `/project/*` stay excluded from sitemap and disallowed in robots.txt (contract compliance). Do not "fix" this.

## Manual steps (cannot be done from code — Allan must do these)

| # | Step | Where | Blocks |
|---|---|---|---|
| M1 | Set `NEXT_PUBLIC_SERVER_URL` = `https://www.allanai.dev` | Vercel dashboard → Settings → Environment Variables (Production) | Task 3 verification, Task 8 |
| M2 | Redeploy after M1 so the new env var takes effect | Vercel | Task 8 |
| M3 | Create GA4 property, get `G-XXXXXXX`, add as `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Vercel dashboard | Task 7 (optional — no-ops if unset) |
| M4 | Enable Speed Insights for the project | Vercel dashboard → Speed Insights | Task 7 |
| M5 | Provide 1200×630 OG image | — | Task 5 |

**M1 is the single most important manual step.** The dashboard env var currently reads `https://allanai.dev` (non-www) and **overrides** `vercel.json`. That is why the live sitemap emits non-www URLs. No code change fixes this.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/utilities/getURL.ts` (modify) | Single source of truth for the canonical site URL; new `getCanonicalURL()` normalizes and strips trailing slash |
| `src/app/robots.ts` (create, moved) | robots.txt metadata route at app root |
| `src/app/sitemap.ts` (create, moved) | sitemap.xml metadata route at app root, DB-driven |
| `src/app/(frontend)/robots.ts` (delete) | — |
| `src/app/(frontend)/sitemap.ts` (delete) | — |
| `src/app/(frontend)/(sitemaps)/` (delete) | Orphaned duplicate sitemaps |
| `next-sitemap.config.cjs` (delete) | Dead — `postbuild` never runs on Vercel |
| `src/utilities/mergeOpenGraph.ts` (modify) | Allan's OG defaults, not Payload's |
| `src/utilities/jsonLd.ts` (modify) | Use `getCanonicalURL()`; enrich Person schema |
| `src/components/Analytics/GoogleAnalytics.tsx` (create) | GA4 via `next/script`, no-ops when env unset |
| `public/llms.txt` (modify) | Refreshed URLs, `/projects` removed |
| `tests/int/seo-robots.int.spec.ts` (create) | robots.txt rules |
| `tests/int/seo-sitemap.int.spec.ts` (create) | sitemap coverage + host |
| `tests/int/seo-metadata.int.spec.ts` (create) | no-Payload-branding regression |

---

## Task 1: Canonical URL helper

Everything downstream resolves the host through this. Doing it first means no task hardcodes a URL.

**Files:**
- Modify: `src/utilities/getURL.ts`
- Test: `tests/int/seo-canonical-url.int.spec.ts`

**Interfaces:**
- Produces: `getCanonicalURL(): string` — always protocol + host, never a trailing slash. `canonicalPath(path: string): string` — joins a path onto the canonical origin.

- [ ] **Step 1: Write the failing test**

Create `tests/int/seo-canonical-url.int.spec.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest'

const ORIGINAL = process.env.NEXT_PUBLIC_SERVER_URL

async function freshImport() {
  // getCanonicalURL reads process.env at call time, but re-import keeps this
  // robust if that ever changes to module-level evaluation.
  const mod = await import('@/utilities/getURL')
  return mod
}

describe('getCanonicalURL', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = ORIGINAL
  })

  it('returns the configured origin without a trailing slash', async () => {
    const { getCanonicalURL } = await freshImport()
    expect(getCanonicalURL()).toBe('https://www.allanai.dev')
  })

  it('strips a trailing slash from the env var', async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev/'
    const { getCanonicalURL } = await freshImport()
    expect(getCanonicalURL()).toBe('https://www.allanai.dev')
  })

  it('joins paths onto the canonical origin', async () => {
    const { canonicalPath } = await freshImport()
    expect(canonicalPath('/services')).toBe('https://www.allanai.dev/services')
    expect(canonicalPath('services')).toBe('https://www.allanai.dev/services')
    expect(canonicalPath('/')).toBe('https://www.allanai.dev')
  })

  it('falls back to localhost when nothing is configured', async () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    const { getCanonicalURL } = await freshImport()
    expect(getCanonicalURL()).toBe('http://localhost:3000')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:db:up
pnpm exec vitest run tests/int/seo-canonical-url.int.spec.ts
```

Expected: FAIL — `getCanonicalURL is not a function`.

- [ ] **Step 3: Implement**

Append to `src/utilities/getURL.ts` (keep the existing exports untouched — `getServerSideURL` is used by `payload.config.ts` and the Lighthouse badge):

```ts
/**
 * The canonical public origin, normalized: protocol + host, never a trailing
 * slash. Every SEO surface (sitemap, robots, canonical tags, JSON-LD) must use
 * this so the host can't drift between them again.
 *
 * The www-vs-non-www split that broke indexing came from three places
 * disagreeing: vercel.json, the Vercel dashboard env var, and getServerSideURL.
 * The dashboard var wins at runtime, so it is the one that must say www.
 */
export const getCanonicalURL = (): string => {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  return raw.replace(/\/+$/, '')
}

/** Join a path onto the canonical origin. `canonicalPath('/')` returns the bare origin. */
export const canonicalPath = (path: string): string => {
  const origin = getCanonicalURL()
  if (!path || path === '/') return origin
  return `${origin}/${path.replace(/^\/+/, '')}`
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm exec vitest run tests/int/seo-canonical-url.int.spec.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utilities/getURL.ts tests/int/seo-canonical-url.int.spec.ts
git commit -m "feat(seo): add canonical URL helper as the single host source of truth"
```

---

## Task 2: Fix robots.txt (the 404)

**This is the highest-impact task.** Production `/robots.txt` returns a Next.js 404 page carrying `<meta name="robots" content="noindex">`.

**Root cause is NOT established.** `sitemap.ts` serves correctly from the identical route group, which rules out the obvious theory. The fix relocates to the documented app-root location, and **Step 6 is a real build verification, not an assumption.** If the build does not emit `robots.txt`, STOP and diagnose — do not work around it.

**Files:**
- Create: `src/app/robots.ts`
- Delete: `src/app/(frontend)/robots.ts`
- Modify: `.gitignore`
- Delete: `public/robots.txt` (stale, localhost URLs)
- Test: `tests/int/seo-robots.int.spec.ts`

**Interfaces:**
- Consumes: `getCanonicalURL()` from Task 1.
- Produces: default-exported `robots(): MetadataRoute.Robots`.

- [ ] **Step 1: Write the failing test**

Create `tests/int/seo-robots.int.spec.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import type { MetadataRoute } from 'next'

let result: MetadataRoute.Robots

const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']
const MUST_DISALLOW = ['/admin/', '/api/', '/projects', '/project/']

describe('robots.txt', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
    const mod = await import('@/app/robots')
    result = mod.default()
  })

  const rules = () => (Array.isArray(result.rules) ? result.rules : [result.rules])

  it('points at the sitemap on the canonical www host', () => {
    expect(result.sitemap).toBe('https://www.allanai.dev/sitemap.xml')
  })

  it('allows the general crawler', () => {
    const wildcard = rules().find((r) => r.userAgent === '*')
    expect(wildcard).toBeDefined()
    expect(wildcard!.allow).toBe('/')
  })

  it.each(AI_CRAWLERS)('explicitly allows %s', (agent) => {
    const rule = rules().find((r) => r.userAgent === agent)
    expect(rule, `no rule for ${agent}`).toBeDefined()
    expect(rule!.allow).toBe('/')
  })

  it('disallows admin, api and the contract-blocked project routes for every agent', () => {
    for (const rule of rules()) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
      for (const path of MUST_DISALLOW) {
        expect(disallow, `${rule.userAgent} must disallow ${path}`).toContain(path)
      }
    }
  })

  it('never advertises the non-www host', () => {
    expect(JSON.stringify(result)).not.toMatch(/https:\/\/allanai\.dev/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec vitest run tests/int/seo-robots.int.spec.ts
```

Expected: FAIL — cannot resolve `@/app/robots`.

- [ ] **Step 3: Create the new robots route**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { getCanonicalURL } from '@/utilities/getURL'

/**
 * Lives at the app root, NOT inside the (frontend) route group.
 *
 * Production /robots.txt returned a 404 while this file sat in
 * src/app/(frontend)/. The cause was never proven — sitemap.ts served fine
 * from the same group — so this is placed at the documented root location and
 * verified by an actual production build rather than by assumption.
 */

// Blocked for every agent. /projects is contract-blocked, not an SEO choice.
const DISALLOW = ['/admin/', '/api/', '/projects', '/project/']

// Explicitly allowed. public/llms.txt actively invites LLM crawlers, so the
// stance is stated rather than left to default-allow. They inherit DISALLOW,
// which keeps the /projects contract restriction intact.
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalURL()

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
```

- [ ] **Step 4: Delete the old route and stale artifact**

```bash
git rm src/app/\(frontend\)/robots.ts
rm -f public/robots.txt
```

- [ ] **Step 5: Un-ignore the generated artifacts**

In `.gitignore`, delete these two lines (they exist only for next-sitemap, which Task 4 removes):

```
public/robots.txt
public/sitemap*.xml
```

- [ ] **Step 6: Run test, then VERIFY WITH A REAL BUILD**

```bash
pnpm exec vitest run tests/int/seo-robots.int.spec.ts
```

Expected: PASS, 8 tests.

Now the verification that actually matters. **Check no `resume-builder-app` container is running first** (never build on the host while it is up):

```bash
docker ps --format '{{.Names}}' | grep -q resume-builder-app && echo "STOP: app container is up" || echo "safe to build"
pnpm build 2>&1 | tail -40
```

Then confirm the route exists in the build output:

```bash
grep -r "robots" .next/server/app-paths-manifest.json .next/app-path-routes-manifest.json 2>/dev/null
ls .next/server/app/ | grep -i robots
```

Expected: a `robots.txt` entry appears.

**If it does not appear, STOP.** Do not proceed to Task 3 and do not deploy. Report the build output and diagnose. Candidate next checks: whether `next.config.js` `redirects` intercepts it, whether a `public/` collision persists in the build cache, and what `.next/app-path-routes-manifest.json` actually lists.

- [ ] **Step 7: Commit**

```bash
git add src/app/robots.ts .gitignore
git add -A src/app/\(frontend\)/robots.ts
git commit -m "fix(seo): serve robots.txt from the app root, allow AI crawlers explicitly

Production /robots.txt returned a Next.js 404 page — complete with
noindex — so crawlers had no directives and no sitemap pointer at all.

The route file existed and was committed. The cause is still unproven:
sitemap.ts serves correctly from the identical route group, which rules
out 'metadata files don't work in route groups'. Rather than guess, this
moves both to the documented app-root location and verifies against a
real production build.

AI crawlers get explicit Allow rules because public/llms.txt already
invites them; they inherit the same disallow set, so the /projects
contract block is unchanged."
```

---

## Task 3: DB-driven sitemap on the canonical host

**Files:**
- Create: `src/app/sitemap.ts`
- Delete: `src/app/(frontend)/sitemap.ts`
- Test: `tests/int/seo-sitemap.int.spec.ts`

**Interfaces:**
- Consumes: `getCanonicalURL()`, `canonicalPath()` from Task 1.
- Produces: default-exported `async sitemap(): Promise<MetadataRoute.Sitemap>`.

- [ ] **Step 1: Write the failing test**

Create `tests/int/seo-sitemap.int.spec.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { MetadataRoute } from 'next'

let payload: Payload
let entries: MetadataRoute.Sitemap

describe('sitemap.xml', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
    payload = await getPayload({ config: await config })

    await payload.create({
      collection: 'posts',
      data: {
        title: 'Sitemap Published Fixture',
        slug: 'sitemap-published-fixture',
        _status: 'published',
        content: {
          root: {
            type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
            children: [{
              type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
              children: [{ type: 'text', text: 'body', format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
            }],
          },
        },
      } as never,
    })

    await payload.create({
      collection: 'posts',
      data: {
        title: 'Sitemap Draft Fixture',
        slug: 'sitemap-draft-fixture',
        _status: 'draft',
        content: {
          root: {
            type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
            children: [{
              type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
              children: [{ type: 'text', text: 'body', format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
            }],
          },
        },
      } as never,
    })

    const mod = await import('@/app/sitemap')
    entries = await mod.default()
  })

  const urls = () => entries.map((e) => e.url)

  it('emits only canonical www URLs', () => {
    for (const url of urls()) {
      expect(url.startsWith('https://www.allanai.dev'), `bad host: ${url}`).toBe(true)
    }
  })

  it('includes the core static routes', () => {
    expect(urls()).toEqual(
      expect.arrayContaining([
        'https://www.allanai.dev',
        'https://www.allanai.dev/services',
        'https://www.allanai.dev/certifications',
        'https://www.allanai.dev/contact',
        'https://www.allanai.dev/posts',
      ]),
    )
  })

  it('includes published posts', () => {
    expect(urls()).toContain('https://www.allanai.dev/posts/sitemap-published-fixture')
  })

  it('excludes draft posts', () => {
    expect(urls()).not.toContain('https://www.allanai.dev/posts/sitemap-draft-fixture')
  })

  it('excludes the contract-blocked project routes', () => {
    for (const url of urls()) {
      expect(url).not.toMatch(/\/projects?(\/|$)/)
    }
  })

  it('uses a real lastModified per entry, not a single now-timestamp', () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeDefined()
    }
    // The old implementation stamped every entry with `new Date()` at request
    // time, which tells crawlers the whole site changed on every fetch.
    const postEntry = entries.find((e) => e.url.endsWith('/sitemap-published-fixture'))
    expect(postEntry?.lastModified).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec vitest run tests/int/seo-sitemap.int.spec.ts
```

Expected: FAIL — cannot resolve `@/app/sitemap`.

- [ ] **Step 3: Implement**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { canonicalPath } from '@/utilities/getURL'

/**
 * Static routes always present. /projects and /project/* are deliberately
 * absent for contract compliance — they stay reachable to visitors but are
 * hidden from crawlers (see also the disallow list in src/app/robots.ts).
 */
const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/certifications', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/posts', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: canonicalPath(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  try {
    const payload = await getPayload({ config: configPromise })

    // overrideAccess: false so unpublished drafts can never leak into the
    // sitemap. Each entry carries the document's real updatedAt — stamping
    // everything with `new Date()` tells crawlers the entire site changed on
    // every fetch, and they learn to distrust the signal.
    const [posts, pages] = await Promise.all([
      payload.find({
        collection: 'posts',
        overrideAccess: false,
        limit: 1000,
        pagination: false,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'pages',
        overrideAccess: false,
        limit: 1000,
        pagination: false,
        select: { slug: true, updatedAt: true },
      }),
    ])

    for (const post of posts.docs) {
      if (!post.slug) continue
      entries.push({
        url: canonicalPath(`/posts/${post.slug}`),
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    for (const page of pages.docs) {
      // 'home' renders at / and is already in STATIC_ROUTES.
      if (!page.slug || page.slug === 'home') continue
      entries.push({
        url: canonicalPath(`/${page.slug}`),
        lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (err) {
    // A DB blip must not take the whole sitemap down — serving the static
    // routes beats serving a 500 to Googlebot.
    console.error('[sitemap] failed to load CMS routes, serving static only:', err)
  }

  return entries
}
```

- [ ] **Step 4: Delete the old route and the orphaned duplicates**

```bash
git rm src/app/\(frontend\)/sitemap.ts
git rm -r src/app/\(frontend\)/\(sitemaps\)
```

The `(sitemaps)` routes served `/pages-sitemap.xml` and `/posts-sitemap.xml`. Nothing links to them — the only pointer was in the next-sitemap robots.txt, which 404s — so no crawler has them. Confirm before deleting:

```bash
grep -rn "pages-sitemap\|posts-sitemap" src/ public/ *.js *.cjs 2>/dev/null | grep -v node_modules
```

Expected after deletion: only `next-sitemap.config.cjs` (removed in Task 4).

- [ ] **Step 5: Run tests**

```bash
pnpm exec vitest run tests/int/seo-sitemap.int.spec.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/sitemap.ts tests/int/seo-sitemap.int.spec.ts
git add -A "src/app/(frontend)"
git commit -m "feat(seo): drive the sitemap from the DB on the canonical host

The live sitemap listed 4 URLs on the non-www host while the site serves
www, so every URL in it redirected. Posts and CMS pages were missing
entirely, and every entry was stamped with a request-time new Date(),
which tells crawlers the whole site changed on every fetch.

Now queries Payload with overrideAccess: false (drafts stay out) and uses
each document's real updatedAt. A DB failure degrades to the static
routes rather than 500ing at Googlebot.

Also removes the orphaned (sitemaps) routes: the only thing that ever
pointed at them was the next-sitemap robots.txt, which 404s."
```

---

## Task 4: Delete the dead next-sitemap system

`postbuild` never runs on Vercel — `scripts/vercel-build.sh` calls `npx next build` directly, and npm lifecycle scripts only fire for `pnpm build`. The committed `public/sitemap.xml` points at `http://localhost:3000`.

**Files:**
- Delete: `next-sitemap.config.cjs`
- Delete: `public/sitemap.xml`
- Modify: `package.json`

- [ ] **Step 1: Confirm it is genuinely dead**

```bash
grep -n "postbuild" package.json
grep -n "next build\|pnpm build" scripts/vercel-build.sh
```

Expected: `postbuild` exists in package.json; vercel-build.sh calls `npx next build` — confirming the script never fires in production.

- [ ] **Step 2: Remove**

```bash
git rm next-sitemap.config.cjs
rm -f public/sitemap.xml
pnpm remove next-sitemap
```

Then delete the `postbuild` line from `package.json` scripts:

```json
"postbuild": "next-sitemap --config next-sitemap.config.cjs",
```

- [ ] **Step 3: Verify the build still works**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git add -A next-sitemap.config.cjs public/
git commit -m "chore(seo): delete the dead next-sitemap system

It has never run in production. scripts/vercel-build.sh calls
\`npx next build\`, and npm lifecycle scripts only fire via \`pnpm build\`,
so postbuild never executed on Vercel. Its committed output
(public/sitemap.xml) still pointed at http://localhost:3000, and its
config excluded '/*' anyway.

The App Router sitemap.ts is the real one. Two competing systems where
one is silently dead is worse than one."
```

---

## Task 5: Remove Payload template branding

Live production HTML currently serves `og:title` = "Payload Website Template" and `twitter:creator` = `@payloadcms`. Every share of the site on LinkedIn or Slack shows Payload's branding.

**Files:**
- Modify: `src/utilities/mergeOpenGraph.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/plugins/index.ts`
- Test: `tests/int/seo-metadata.int.spec.ts`

- [ ] **Step 1: Write the failing regression test**

Create `tests/int/seo-metadata.int.spec.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest'

describe('production metadata carries no Payload template branding', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://www.allanai.dev'
  })

  it('mergeOpenGraph defaults mention neither Payload nor the template OG image', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = JSON.stringify(mergeOpenGraph())

    expect(og).not.toMatch(/payload/i)
    expect(og).not.toMatch(/website-template-OG/i)
  })

  it('mergeOpenGraph defaults use the canonical www host', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = JSON.stringify(mergeOpenGraph())

    expect(og).toMatch(/https:\/\/www\.allanai\.dev/)
    expect(og).not.toMatch(/https:\/\/allanai\.dev/)
  })

  it('caller-supplied values still override the defaults', async () => {
    const { mergeOpenGraph } = await import('@/utilities/mergeOpenGraph')
    const og = mergeOpenGraph({ title: 'Custom Title' })

    expect(og?.title).toBe('Custom Title')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec vitest run tests/int/seo-metadata.int.spec.ts
```

Expected: FAIL — defaults still say "Payload Website Template".

- [ ] **Step 3: Rewrite mergeOpenGraph**

Replace `src/utilities/mergeOpenGraph.ts` entirely:

```ts
import type { Metadata } from 'next'
import { getCanonicalURL } from './getURL'

const SITE_NAME = 'Ronald Allan Rivera'
const DEFAULT_TITLE =
  'Ronald Allan Rivera | Full-Stack Developer, AI Automation, Laravel, WordPress, React'
const DEFAULT_DESCRIPTION =
  'Senior full-stack developer with 20+ years building Python automation, Laravel and Django backends, WordPress plugins, and React/Next.js frontends for SaaS platforms and startups.'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  siteName: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  images: [
    {
      url: `${getCanonicalURL()}/og-default.png`,
      width: 1200,
      height: 630,
      alt: SITE_NAME,
    },
  ],
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
```

- [ ] **Step 4: Add the OG image**

Place the 1200×630 image from manual step M5 at `public/og-default.png`.

If it is not yet available, temporarily point `images` at an existing asset rather than shipping a broken URL — but do **not** leave `website-template-OG.webp` referenced.

- [ ] **Step 5: Fix the layout metadata**

In `src/app/(frontend)/layout.tsx`, replace the exported metadata block:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalURL()),
  alternates: { canonical: '/' },
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@allanwebdesign',
  },
}
```

Update the import at the top of the file:

```ts
import { getCanonicalURL } from '@/utilities/getURL'
```

and remove the now-unused `getServerSideURL` import if nothing else in the file uses it.

> If `@allanwebdesign` is not the correct X/Twitter handle, ask Allan before committing. Do not guess a handle — a wrong one credits a stranger.

- [ ] **Step 6: Fix the SEO plugin title generator**

In `src/plugins/index.ts`, replace `generateTitle` and `generateURL`:

```ts
const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Ronald Allan Rivera` : 'Ronald Allan Rivera'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getCanonicalURL()
  return doc?.slug ? `${url}/${doc.slug}` : url
}
```

Update its import from `getServerSideURL` to `getCanonicalURL`.

- [ ] **Step 7: Run tests and typecheck**

```bash
pnpm exec vitest run tests/int/seo-metadata.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: 3 tests PASS, typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add src/utilities/mergeOpenGraph.ts "src/app/(frontend)/layout.tsx" src/plugins/index.ts tests/int/seo-metadata.int.spec.ts public/og-default.png
git commit -m "fix(seo): replace Payload template branding in production metadata

Live HTML served og:title 'Payload Website Template', og:description
'An open-source website built with Payload and Next.js', and
twitter:creator @payloadcms — so every LinkedIn or Slack share of the
site showed Payload's branding, not Allan's. /posts titled itself
'Payload Website Template Posts' from the SEO plugin's generateTitle.

Adds a regression test asserting no production OG/Twitter tag contains
the string 'Payload', because this shipped unnoticed once already."
```

---

## Task 6: Canonical tags on every route

**Files:**
- Modify: `src/app/(frontend)/services/page.tsx`, `certifications/page.tsx`, `contact/page.tsx`, `posts/page.tsx`, `posts/[slug]/page.tsx`, `[slug]/page.tsx`

**Interfaces:**
- Consumes: `canonicalPath()` from Task 1.

- [ ] **Step 1: Add canonical to each static route**

For each page with a static `metadata` export, add an `alternates` key. Example for `src/app/(frontend)/services/page.tsx`:

```ts
export const metadata: Metadata = {
  title: 'Services — Hire Me',
  description:
    'Freelance engineering services and engagement options. Consultations, project work, and retainers — pick the package that fits.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Services — Hire Me',
    description: 'Freelance packages and engagement options',
    type: 'website',
  },
}
```

Relative canonicals resolve against `metadataBase` (set in the root layout in Task 5), so `/services` renders as `https://www.allanai.dev/services`.

Apply the same pattern: `/certifications`, `/contact`, `/posts`.

- [ ] **Step 2: Add canonical to dynamic routes**

In `src/app/(frontend)/posts/[slug]/page.tsx`, inside `generateMetadata`, add to the returned object:

```ts
alternates: { canonical: `/posts/${slug}` },
```

In `src/app/(frontend)/[slug]/page.tsx`:

```ts
alternates: { canonical: slug === 'home' ? '/' : `/${slug}` },
```

- [ ] **Step 3: Verify with a build and a grep**

```bash
pnpm build 2>&1 | tail -20
pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add -A "src/app/(frontend)"
git commit -m "feat(seo): add canonical tags to every public route

There were none anywhere, while both www and non-www resolve and / and
/home render the same content — textbook duplicate-content exposure.
Canonicals are relative and resolve against metadataBase, so the host
comes from one place."
```

---

## Task 7: Analytics

**Files:**
- Create: `src/components/Analytics/GoogleAnalytics.tsx`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install Speed Insights**

```bash
pnpm add @vercel/speed-insights
```

- [ ] **Step 2: Create the GA4 component**

Create `src/components/Analytics/GoogleAnalytics.tsx`:

```tsx
import Script from 'next/script'

/**
 * GA4, loaded only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set — so local dev
 * and preview deploys stay out of the production property with no extra
 * config, and no measurement ID is committed to git.
 *
 * afterInteractive keeps the tag off the critical path: Core Web Vitals are a
 * ranking factor, so the analytics tag must not cost us LCP.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
```

- [ ] **Step 3: Mount both in the layout**

In `src/app/(frontend)/layout.tsx`, add imports:

```ts
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/Analytics/GoogleAnalytics'
```

and render them at the end of `<body>`, after `<Providers>`:

```tsx
      <body className="relative bg-black">
        <StarfieldClient />
        <Providers>{children}</Providers>
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
```

> These go in the **layout**, never at the page level of `src/app/(frontend)/page.tsx`. Adding client-side data access there would opt the homepage out of static rendering and force a serverless execution per visit (CLAUDE.md).

- [ ] **Step 4: Document the env var**

Add to `.env.example`:

```
# Google Analytics 4 measurement ID (G-XXXXXXXXXX). Unset = GA4 disabled.
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

- [ ] **Step 5: Verify the homepage is still static**

```bash
pnpm build 2>&1 | grep -A 30 "Route (app)" | head -40
```

Expected: `/` is marked static (`○` or `●`), **not** dynamic (`ƒ`). If it flipped to dynamic, revert and investigate before committing.

- [ ] **Step 6: Commit**

```bash
git add src/components/Analytics/GoogleAnalytics.tsx "src/app/(frontend)/layout.tsx" package.json pnpm-lock.yaml .env.example
git commit -m "feat(seo): add Speed Insights and env-gated GA4

The site had no analytics of any kind — no gtag, no GTM, no Vercel
Analytics. Search Console will cover query data; Speed Insights covers
real-user Core Web Vitals, which is the only one of these that is itself
a ranking factor.

GA4 no-ops when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, so dev and
preview stay out of the production property and no ID lands in git.
Both mount in the layout — never at homepage page level, which would
break static rendering."
```

---

## Task 8: Structured data and llms.txt

**Files:**
- Modify: `src/utilities/jsonLd.ts`
- Modify: `src/app/(frontend)/certifications/page.tsx`, `services/page.tsx`
- Modify: `public/llms.txt`

- [ ] **Step 1: Point jsonLd at the canonical helper and enrich Person**

In `src/utilities/jsonLd.ts`, replace each of the three occurrences of:

```ts
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
```

with:

```ts
const baseUrl = getCanonicalURL()
```

and add the import:

```ts
import { getCanonicalURL } from './getURL'
```

Then extend `generatePersonSchema` — after the `sameAs` line, before the `email` block:

```ts
  // knowsAbout / hasCredential give answer engines an explicit competency list
  // rather than making them infer one from prose.
  schema.knowsAbout = [
    'Full-Stack Web Development',
    'Python', 'Django', 'Laravel', 'PHP',
    'React', 'Next.js', 'TypeScript',
    'WordPress Plugin Development',
    'AI Automation', 'API Design', 'DevOps',
  ]

  schema.worksFor = {
    '@type': 'Organization',
    name: profile?.fullName || settings?.siteName || '',
    url: baseUrl,
  }
```

- [ ] **Step 2: Wire the unused generators into pages**

`generateWebPageSchema`, `generateBreadcrumbSchema`, and `generateCertificationSchema` already exist in `jsonLd.ts` and are **never called**. Render them.

In `src/app/(frontend)/certifications/page.tsx`, import and render alongside the existing content:

```tsx
import { JsonLd } from '@/components/JsonLd'
import {
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateCertificationSchema,
} from '@/utilities/jsonLd'
import { canonicalPath } from '@/utilities/getURL'
```

and inside the returned JSX:

```tsx
      <JsonLd
        data={generateWebPageSchema(
          'Certifications',
          'Professional certifications in full-stack development, AI, cloud, and WordPress.',
          canonicalPath('/certifications'),
        )}
      />
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: canonicalPath('/') },
          { name: 'Certifications', url: canonicalPath('/certifications') },
        ])}
      />
      {certifications.map((cert) => (
        <JsonLd key={cert.id} data={generateCertificationSchema(cert)} />
      ))}
```

> Adapt the variable name `certifications` to whatever the page already uses for its fetched list — read the file before editing.

- [ ] **Step 3: Refresh llms.txt**

In `public/llms.txt`, replace the "Key Pages" block:

```
## Key Pages
- Homepage: https://www.allanai.dev/
- Services: https://www.allanai.dev/services
- Certifications: https://www.allanai.dev/certifications
- Blog: https://www.allanai.dev/posts
- Contact: https://www.allanai.dev/contact
```

Three fixes in one: `/projects` is removed (it is `Disallow`-ed for contract compliance, so listing it pointed LLMs at a crawler-blocked path — a contradictory signal), `/experience` is removed (it now 308-redirects to `/#experience`), and every URL moves to the canonical www host.

Also replace any other `https://allanai.dev` occurrence in the file with `https://www.allanai.dev`:

```bash
grep -c "https://allanai.dev" public/llms.txt
```

- [ ] **Step 4: Typecheck and validate**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/utilities/jsonLd.ts "src/app/(frontend)" public/llms.txt
git commit -m "feat(seo): expand structured data, fix contradictory llms.txt

jsonLd.ts already defined generateWebPageSchema, generateBreadcrumbSchema
and generateCertificationSchema — none were ever called. Wires them up
and enriches Person with knowsAbout/worksFor so answer engines get an
explicit competency list instead of inferring one from prose.

llms.txt listed /projects as a key page while robots.txt disallows it,
and /experience which now 308s to /#experience. Both removed, all URLs
moved to the canonical www host."
```

---

## Task 9: Rewrite /services (thin-content fix)

`/services` is 148 visible words and is the conversion page. This task needs Allan's factual input — **do not invent deliverables, timelines, or pricing.**

**Files:**
- Modify: `src/templates/rainbow/` services template (locate with a grep first)

- [ ] **Step 1: Locate the template**

```bash
grep -rn "Need a Custom Solution" src/templates/ | head
```

- [ ] **Step 2: Draft the structure and get facts from Allan**

Sections to fill, target 800–1,200 words:

1. What each package includes (per `Packages` collection entry)
2. Deliverables and timelines
3. Process — how an engagement runs start to finish
4. Who it is for / who it is not for
5. FAQ — 5–8 questions (feeds `FAQPage` schema)

**Ask Allan for:** exact deliverables per package, realistic timelines, and what he will and will not commit to. Draft prose around his answers; do not fabricate commitments.

- [ ] **Step 3: Add Service and FAQPage schema**

Add to `src/utilities/jsonLd.ts`:

```ts
/** Service schema per booking package, for rich results on /services. */
export function generateServiceSchema(pkg: {
  name?: string | null
  description?: string | null
  price?: number | null
  slug?: string | null
}) {
  const baseUrl = getCanonicalURL()
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: pkg.name || '',
    description: pkg.description || '',
    provider: { '@type': 'Person', name: 'Ronald Allan Rivera', url: baseUrl },
    areaServed: 'Worldwide',
  }

  if (pkg.price != null) {
    schema.offers = {
      '@type': 'Offer',
      price: pkg.price,
      priceCurrency: 'USD',
      url: pkg.slug ? `${baseUrl}/book/${pkg.slug}` : `${baseUrl}/services`,
    }
  }

  return schema
}

/** FAQPage schema from the /services FAQ. */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}
```

> Confirm the real field names on the `Packages` collection before wiring this — read `src/collections/Packages*` and adapt. `priceCurrency` must match what the booking flow actually charges; check `src/BookingSettings/config.ts` and the booking emails rather than assuming USD.

- [ ] **Step 4: Fix internal linking**

Every page currently links to `/projects`, which is `Disallow`-ed — the strongest internal links point at a crawler-blocked path. Redirect that equity:

```bash
grep -rn 'href="/projects"' src/templates/ src/components/ | head -20
```

Replace with contextual links to `/services` and `/certifications` using descriptive anchor text (not "view all"). Keep `/projects` reachable for human visitors where it genuinely helps them — the goal is to stop spending *crawl equity* there, not to hide the work from people.

- [ ] **Step 5: Verify and commit**

```bash
pnpm exec tsc --noEmit && pnpm lint
git add -A src/templates src/utilities/jsonLd.ts
git commit -m "feat(seo): expand /services and redirect internal link equity

/services was 148 words — the thinnest page on the site and the one with
actual buying intent. Now covers deliverables, process, and an FAQ, and
emits Service + FAQPage schema.

Also stops every page spending its strongest internal links on
/projects, which robots.txt disallows."
```

---

## Task 10: Deploy and verify in production

- [ ] **Step 1: Confirm M1 is done**

Ask Allan to confirm `NEXT_PUBLIC_SERVER_URL` = `https://www.allanai.dev` in the Vercel dashboard (Production). **Do not deploy before this** — deploying with the old value re-emits non-www URLs.

- [ ] **Step 2: Push and let Vercel deploy**

```bash
git push origin main
```

- [ ] **Step 3: Verify against production**

```bash
echo "=== robots.txt (MUST be 200) ==="
curl -sS -o /tmp/r.txt -w "HTTP %{http_code}\n" https://www.allanai.dev/robots.txt && cat /tmp/r.txt

echo "=== sitemap host (MUST be www) ==="
curl -sS https://www.allanai.dev/sitemap.xml | grep -o 'https://[a-z.]*allanai\.dev' | sort -u

echo "=== no Payload branding ==="
curl -sS https://www.allanai.dev/ | grep -ci payload

echo "=== canonical present ==="
curl -sS https://www.allanai.dev/services | grep -o '<link rel="canonical"[^>]*>'
```

Expected: robots 200 with the AI-crawler rules; sitemap shows **only** `https://www.allanai.dev`; Payload count **0**; a canonical tag present.

**If robots.txt is still 404, stop and diagnose. Do not proceed to Task 11.**

- [ ] **Step 4: Commit nothing** — this task is verification only.

---

## Task 11: Google + Bing submission runbook

Runs **only after Task 10 passes**. Submitting earlier indexes the wrong host and costs a re-crawl wait.

- [ ] **Step 1: Verify the domain in Google Search Console**

Use the **Domain** property type with a DNS TXT record, not URL-prefix — it covers www and non-www together.

- [ ] **Step 2: Submit the sitemap**

Search Console → Sitemaps → submit `https://www.allanai.dev/sitemap.xml`. Confirm it reports "Success" and the discovered URL count matches the sitemap.

- [ ] **Step 3: Request indexing on the money pages**

URL Inspection → Request Indexing for `/`, `/services`, `/certifications`.

- [ ] **Step 4: Repeat in Bing Webmaster Tools**

Bing's index also feeds ChatGPT search, so this is part of the AI-visibility goal, not an afterthought.

- [ ] **Step 5: Validate structured data**

- Google Rich Results Test on `/`, `/services`, `/certifications`
- Schema.org validator on the same three

Expected: `Person`, `WebSite`, `WebPage`, `BreadcrumbList`, `Service`, `FAQPage` detected with no errors.

- [ ] **Step 6: Record the baseline**

Note the date. Impressions should appear in Search Console within days; position movement takes 3–6 months on a new domain. Review monthly.

- [ ] **Step 7: Mark the old checklist superseded**

Add to the top of `docs/SEO_CHECKLIST.md`:

```markdown
> **SUPERSEDED (2026-07-22)** by
> `docs/superpowers/specs/2026-07-22-seo-foundation-design.md`.
> This file documents /experience and /projects as indexable standalone pages.
> /experience now 308-redirects to /#experience and /projects is deliberately
> crawler-blocked. Kept for history of what was tried.
```

```bash
git add docs/SEO_CHECKLIST.md
git commit -m "docs(seo): mark the old SEO checklist superseded"
git push origin main
```

---

## Self-review notes

**Spec coverage:** Section 1 → Tasks 1, 2, 4, 6. Section 2 → Task 3. Section 3 → Task 5. Section 4 → Task 8. Section 5 → Task 7. Section 6 → Task 11. Section 7a/7d → Task 9. Section 7b (blog content) → companion spec. Section 7c → Task 8 (Person schema). Section 7e (backlinks) → out of scope, documented in spec.

**Known gaps, deliberate:**
- Task 9 needs Allan's factual input and cannot be fully specified in advance — flagged inline rather than filled with invented commitments.
- The `@allanwebdesign` Twitter handle in Task 5 is unverified — flagged to confirm before commit.
- `priceCurrency: 'USD'` in Task 9 is an assumption — flagged to verify against the booking flow.
