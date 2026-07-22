# SEO Foundation — Design

**Date:** 2026-07-22
**Status:** Awaiting review
**Scope:** Technical SEO repair, structured data, analytics, Google submission, and content strategy
**Companion spec:** `2026-07-22-ai-blog-generation-design.md` (ships after this one)

---

## Problem

An audit of the live site (`https://www.allanai.dev`) found the site is only
partially indexable, and what search engines and social platforms *do* see is
branded as the Payload CMS starter template rather than as Allan.

Verified live, not inferred:

| Finding | Evidence |
|---|---|
| `/robots.txt` returns 404 | `curl https://www.allanai.dev/robots.txt` → Next.js error page with `<meta name="robots" content="noindex">` |
| Sitemap advertises the wrong host | `/sitemap.xml` emits `https://allanai.dev` (non-www); the site serves `www` and non-www 307s to it |
| No canonical tags anywhere | Zero `alternates.canonical` in the codebase |
| Payload branding in production `<head>` | `og:title` = "Payload Website Template", `twitter:creator` = `@payloadcms` |
| `/posts` titles as Payload | "Payload Website Template Posts" |
| next-sitemap never runs in production | `scripts/vercel-build.sh` calls `npx next build`, which does not trigger the `postbuild` npm script |
| Sitemap covers 4 URLs | Missing `/posts`, `/posts/[slug]`, and all CMS `[slug]` pages |
| No analytics of any kind | No `gtag`, GTM, `@vercel/analytics`, or `@vercel/speed-insights` |
| Thin money page | `/services` is 148 visible words |
| Empty blog | `/posts` has zero published posts |

### Root cause note — robots.txt

The 404 is **confirmed**; the root cause is **not**. `src/app/(frontend)/robots.ts`
exists and is committed, and `src/app/(frontend)/sitemap.ts` — in the identical
route group — serves correctly. That rules out "metadata files don't work in route
groups" as the explanation.

Rather than guess, the fix relocates both metadata files to the app root
(`src/app/`), the location Next.js documents, and **verification is a build step,
not an assumption**: a local production build must show `robots.txt` in the route
manifest before this ships. If relocation does not fix it, the task is to
diagnose further, not to work around it.

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Canonical host | `https://www.allanai.dev` | Matches what Vercel serves today; no redirect flip, no re-crawl churn |
| Analytics | Vercel Speed Insights + GA4 | Speed Insights feeds Core Web Vitals (a ranking factor); GA4 pairs with Search Console |
| AI crawler policy | Explicitly allow | An `llms.txt` already courts LLM visibility; citation by AI answer engines is lead generation |
| `/projects` | Stays crawler-blocked | Contract compliance. Removed from `llms.txt` to stop the mixed signal |
| Content scope | `/services` rewrite included | It is the conversion page and the thinnest page on the site |

---

## Architecture

Seven sections, ordered by dependency. Sections 1–3 must land before Section 6
(Google submission) or the wrong URLs get indexed and require a re-crawl wait.

### Section 1 — Canonical host and discoverability

Three sources currently disagree on the site URL: `vercel.json` says `www`, the
Vercel dashboard env var says non-www (and wins over `vercel.json`), and
`getServerSideURL()` feeds JSON-LD from the env var.

- Set the Vercel dashboard env var `NEXT_PUBLIC_SERVER_URL` to
  `https://www.allanai.dev` so it stops contradicting `vercel.json`
- Move `robots.ts` and `sitemap.ts` from `src/app/(frontend)/` to `src/app/`
- Verify with a local production build that `/robots.txt` is emitted, then verify
  post-deploy with `curl -I` returning 200
- Delete `next-sitemap.config.cjs`, the `next-sitemap` dependency, and the
  `postbuild` script — provably dead in production
- Remove `public/robots.txt` and `public/sitemap*.xml` from `.gitignore` and
  delete the stale localhost artifacts
- Add `alternates.canonical` to the root layout and every page's metadata

**robots.txt output:**

```
User-agent: *
Allow: /
Disallow: /admin/, /api/, /projects, /project/

User-agent: GPTBot          Allow: /   Disallow: (same set)
User-agent: ClaudeBot        Allow: /   Disallow: (same set)
User-agent: PerplexityBot    Allow: /   Disallow: (same set)
User-agent: Google-Extended  Allow: /   Disallow: (same set)

Sitemap: https://www.allanai.dev/sitemap.xml
```

AI crawlers get explicit `Allow` rules but inherit the same `Disallow` set —
contract compliance holds, intent becomes explicit rather than implied.

### Section 2 — Sitemap coverage

Rewrite `sitemap.ts` to query Payload for published posts and CMS pages.

- Use each document's real `updatedAt` as `lastmod`. The current code uses
  `new Date()`, marking every URL as changed on every request — a signal search
  engines learn to distrust
- Keep `/projects` and `/project/*` excluded
- Retire `(sitemaps)/pages-sitemap.xml` and `(sitemaps)/posts-sitemap.xml`; the
  main sitemap will cover them and nothing links to them today
- Respect access control: query with `overrideAccess: false` so drafts never leak

### Section 3 — Remove Payload template branding

| File | Change |
|---|---|
| `src/utilities/mergeOpenGraph.ts` | Real name, headline, description, `siteName` |
| `src/app/(frontend)/layout.tsx` | Remove `twitter:creator: '@payloadcms'` |
| `src/plugins/index.ts` | `generateTitle` → Allan's branding (fixes `/posts`) |
| `public/` | Replace `website-template-OG.webp` with a real 1200×630 OG image |

### Section 4 — Structured data and llms.txt

`src/utilities/jsonLd.ts` already defines `generateWebPageSchema`,
`generateBreadcrumbSchema`, and `generateCertificationSchema` — **all currently
unused**. Wire them up rather than writing new ones.

- `WebPage` schema sitewide
- `BreadcrumbList` on nested routes
- `EducationalOccupationalCredential` on `/certifications`
- Enrich `Person` with `knowsAbout`, `hasCredential`, `worksFor`
- Add `Service` schema to `/services`, derived from the existing `Packages`
  collection, plus `FAQPage` from the new FAQ content
- All schemas emit the canonical `www` host

**llms.txt refresh:** remove `/projects` (crawler-blocked — currently a
contradictory signal), fix `/experience` → `/#experience` (it now 308-redirects),
switch all URLs to `www`.

### Section 5 — Analytics

- `@vercel/speed-insights` — real-user Core Web Vitals. The only item here that
  directly affects rankings
- GA4 behind `NEXT_PUBLIC_GA_MEASUREMENT_ID`, no-op when unset, loaded via
  `next/script` with `strategy="afterInteractive"` so it does not hurt LCP
- No measurement ID is committed to git

**Constraint:** neither may be added at the page level of
`src/app/(frontend)/page.tsx` in a way that opts the homepage out of static
rendering. CLAUDE.md documents this; the homepage must stay statically generated
with 5-minute ISR.

### Section 6 — Google submission runbook

Runs **after** Sections 1–3 are deployed and verified.

1. Verify domain ownership in Google Search Console via **DNS TXT record**
   (covers both www and non-www, unlike the URL-prefix method)
2. Set `https://www.allanai.dev` as the preferred property
3. Submit `https://www.allanai.dev/sitemap.xml`
4. Use URL Inspection → Request Indexing on `/`, `/services`, `/certifications`
5. Repeat verification + sitemap submission in **Bing Webmaster Tools** (Bing's
   index also feeds ChatGPT search)
6. Validate structured data: Google Rich Results Test + Schema.org validator
7. Confirm `curl -I https://www.allanai.dev/robots.txt` returns 200

**Expectation setting:** impressions appear in Search Console within days;
meaningful position movement takes 3–6 months on a new domain. The measurable
early wins are indexation coverage and Core Web Vitals.

### Section 7 — SEO improvement (content strategy)

Sections 1–6 make the site *indexable*. They do not make it *rank*.

**Targeting reality:** ranking for "full-stack developer" or "WordPress developer"
is not achievable — those are dominated by Toptal, Upwork, and agencies with
thousands of backlinks. The winnable ground is long-tail and intent-specific.

**7a. Rewrite `/services` (highest ROI).** At 148 words it is the conversion page
and the thinnest page on the site. Target 800–1,200 words covering: what each
package includes, deliverables and timelines, process, who it is for, and an FAQ.
Feeds the `Service` and `FAQPage` schema from Section 4.

*Content ownership:* Claude drafts the structure and prose; Allan supplies and
verifies all factual claims about deliverables, timelines, and pricing. No
invented commitments.

**7b. Problem-content, not keyword-content.** With zero posts, `/posts` is dead
weight. Write from work actually done — Wonderkin, Forex Signals, AWS
microservices are genuine differentiators. Posts like "Migrating a Laravel
monolith to AWS microservices" target near-zero-competition queries, demonstrate
first-hand expertise, and are the material LLMs cite. Cadence: 1–2 solid posts a
month. Volume is explicitly a non-goal — see the companion spec.

**7c. Entity / E-E-A-T signals.** Consistent name, title, and URL across the site,
LinkedIn, GitHub, and allanwebdesign.com, plus the enriched `Person` schema.
Cheapest lever available and it compounds.

**7d. Internal linking.** Every page currently links to `/projects`, which is
`Disallow`-ed — the strongest internal links point at a path crawlers cannot
follow. Redirect that equity to `/services` and `/certifications` with descriptive
anchor text.

**7e. Off-site (acknowledged gap).** Backlinks remain the strongest ranking factor
and cannot be fixed in code. Realistic sources: GitHub READMEs, dev.to / Hashnode
cross-posts with canonical tags pointing here, conference and podcast bios.
Manual and ongoing; listed for completeness, not scheduled here.

---

## Testing

| Test | Asserts |
|---|---|
| `sitemap.ts` integration | Only `www` URLs; excludes `/projects`; includes published posts; uses real `updatedAt`; drafts absent |
| `robots.ts` unit | Emits AI-crawler allow rules and the full disallow set; sitemap URL uses `www` |
| Metadata regression | No string containing "Payload" appears in any production OG/Twitter tag |
| Canonical | Every route emits `alternates.canonical` on the `www` host |
| Build verification | Local production build emits `robots.txt` in the route manifest |
| Post-deploy | `curl -I /robots.txt` → 200; `curl /sitemap.xml` → `www` URLs only |

The metadata regression test exists specifically because the Payload branding
shipped to production unnoticed. The build and post-deploy checks exist because
robots.txt failed silently.

---

## Out of scope

- Changing the `/projects` crawler block (contract compliance; unchanged)
- Backlink acquisition (manual, off-site)
- The AI blog generation feature and blog page restyle — companion spec
- Blog post *content* beyond the first two pilot posts

---

## Supersedes

`docs/SEO_CHECKLIST.md` is stale: it documents `/experience` and `/projects` as
standalone indexable pages. `/experience` now 308-redirects to `/#experience` and
`/projects` is deliberately crawler-blocked. That file should be marked superseded
by this spec rather than deleted, to preserve the history of what was tried.

---

## Risks

| Risk | Mitigation |
|---|---|
| Relocating metadata files does not fix the 404 | Verify with a local build **before** deploy; if unfixed, diagnose rather than work around |
| Changing the env var breaks Vercel Blob or other URL-derived config | Grep every `NEXT_PUBLIC_SERVER_URL` consumer before changing it |
| GA4 script hurts LCP | `afterInteractive` strategy; verify with Speed Insights after rollout |
| Deleting `(sitemaps)` routes breaks an unknown consumer | Nothing links to them and robots.txt 404s, so no crawler has discovered them; confirm with a repo grep first |
| Submitting to Google too early | Section 6 is explicitly gated on 1–3 being deployed and verified |
