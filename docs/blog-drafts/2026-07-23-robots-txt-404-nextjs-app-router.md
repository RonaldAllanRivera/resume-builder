---
title: 'Your robots.txt returns 404 in production and the file is right there'
slug: robots-txt-404-nextjs-app-router
metaDescription: 'A Next.js App Router robots.ts that works locally and 404s in production — how a static file in public/ silently shadows a metadata route, and why the postbuild script never ran on Vercel.'
status: draft
---

I found this on my own site, which is the embarrassing part. `https://www.allanai.dev/robots.txt` returned a 404. Not a blank file, not a wrong file — a Next.js error page, served with this in the head:

```html
<meta name="robots" content="noindex">
```

So the one URL whose entire job is telling crawlers what to do was itself telling them to go away. The sitemap was never discovered, because the only thing pointing at it was the `Sitemap:` line inside the robots.txt that didn't exist.

The file was there. It was committed. It looked like this:

```ts
// src/app/(frontend)/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

## The theory that was wrong

The obvious suspect is the route group. `(frontend)` is a Next.js route group — parentheses mean "organise these files without affecting the URL." A reasonable guess is that metadata routes like `robots.ts` don't resolve inside one.

That theory is wrong, and I could prove it in about thirty seconds: `sitemap.ts` sat in **the same directory**, and `/sitemap.xml` served fine in production. Same folder, same route group, one works and one doesn't.

This is worth pausing on, because it's the moment where you either get the fix right or spend a day chasing the wrong thing. I never definitively proved the root cause of that original 404. What I did instead was stop guessing, move both files to the documented location (`src/app/`), and — this is the important part — **treat the build output as the test**:

```bash
pnpm build | grep robots
# ○ /robots.txt    215 B    102 kB
```

That `○` means statically prerendered. If that line hadn't appeared, the fix hadn't worked, and I'd have kept digging instead of deploying and hoping. "It should work now" is not a verification step.

## The bug that was actually going to bite

While running that build, something scrolled past that mattered more than the original problem:

```
> resume-builder@1.0.0 postbuild
> next-sitemap --config next-sitemap.config.cjs

✅ [next-sitemap] Generation completed
```

`next-sitemap` had regenerated `public/robots.txt` and `public/sitemap.xml`. And **a static file in `public/` shadows an App Router metadata route.** Next.js serves `public/robots.txt` and your `robots.ts` never runs.

So the sequence I was one commit away from shipping was:

1. Move `robots.ts` to the app root — fixed
2. Un-ignore `public/robots.txt` so the stale file could be deleted
3. Run a build at some point
4. `postbuild` silently regenerates `public/robots.txt`
5. It gets committed
6. It shadows the route, and robots.txt is broken again — but now with a *plausible-looking file* sitting in the repo instead of an obvious 404

That second failure would have been far harder to diagnose than the first, because everything would look correct.

Worse, the regenerated file pointed at the wrong host entirely:

```
# Host
Host: https://allanai.dev

Sitemap: https://allanai.dev/sitemap.xml
```

Non-www — while the site serves `www` and redirects non-www to it. Every URL it advertised was a redirect.

## Why postbuild never ran in production

Here's the part that makes this a genuinely nasty class of bug. `next-sitemap` had **never run on Vercel**. Not once.

```json
"scripts": {
  "build": "next build",
  "postbuild": "next-sitemap --config next-sitemap.config.cjs"
}
```

npm lifecycle scripts fire when you run the script they're attached to. `pnpm build` triggers `postbuild`. But the Vercel build command was a shell script that called:

```bash
npx next build
```

`npx next build` invokes the Next.js binary directly. It is not `pnpm build`. No lifecycle script fires.

So the tool had been dead in production since the day it was added, while working perfectly on every developer's machine. Its committed output still pointed at `http://localhost:3000`. Nobody noticed, because the thing it produced was a file nobody ever opened.

That's the shape of the bug worth remembering: **a build step that only runs locally is worse than one that never runs at all**, because local runs keep producing artifacts that look authoritative.

## What I actually changed

Deleted `next-sitemap` entirely. Two sitemap systems where one is silently dead is strictly worse than one system, and the App Router's `sitemap.ts` was already the one being served.

Then I left `public/robots.txt` and `public/sitemap*.xml` **deliberately not gitignored**, with the reasoning written into `.gitignore` itself:

```gitignore
# public/robots.txt and public/sitemap*.xml are deliberately NOT ignored.
# They used to be, which hid next-sitemap's stale localhost output from review.
# robots.txt and sitemap.xml are now App Router metadata routes (src/app/), and
# a static file in public/ would SHADOW them — silently reintroducing the 404
# this replaced. Leaving these paths tracked means a stray file shows up in
# git status instead of quietly breaking indexing.
```

This is the opposite of the instinct. Generated files usually belong in `.gitignore`. But gitignoring these is exactly what let the stale, wrong-host versions sit there unreviewed for months. Now if anything ever regenerates them, it shows up in `git status` — noisy, which is the point.

## The lesson I'd actually keep

Three things, in order of how much time they'd have saved me:

**A file existing is not a route existing.** Metadata routes can be shadowed by static files, skipped by build config, or silently overridden. The only proof that a route exists is the build manifest or a request against the deployed site.

**Verify at the layer where it failed.** This broke in production, so a passing local test proves nothing. The unit test I wrote asserts the rules object is shaped correctly — useful, but it would have passed happily the entire time the URL was 404ing. The check that mattered was `curl -I https://www.allanai.dev/robots.txt` returning `200`.

**Not knowing the root cause is a valid state.** I never proved why the route group version 404'd. I could have kept digging, but the fix — move to the documented location, verify against the build — is correct regardless of the answer, and the verification step means I'd know immediately if it weren't. Saying "I don't know why, and here's how I made it not matter" is more honest than inventing a tidy explanation after the fact.

The whole thing took an afternoon. The site had been effectively invisible to crawlers for considerably longer than that.

---

*Working on a Next.js or Payload build with SEO that isn't behaving? [I take on that kind of work](/services).*
