# Public Site Redesign + AI Chatbot — Design Spec

**Date:** 2026-05-06
**Status:** Draft for review
**Owner:** Allan
**Goal:** Restructure the public site to serve two audiences (hiring managers + paying clients) and add a Claude-powered chatbot grounded in Allan's resume data, with private Telegram alerts for high-intent leads.

---

## 1. Goals

1. Make the site readable in 15 seconds for a hiring manager and 30 seconds for a prospective client.
2. Showcase real AI integration (RAG chatbot grounded in Payload data) as the homepage centerpiece.
3. Cut public site complexity from 11 routes to 6.
4. Preserve current Lighthouse 99 desktop score.
5. Convert chatbot rate-limit hits and high-intent conversations into leads via Telegram alerts.

## 2. Non-goals

- No visual redesign. The `rainbow` template aesthetic stays.
- No public exposure of the existing AI tooling (Generations, JobAds, CoverLetterSettings, AIGenerationSettings). These remain Allan's private job-hunt workflow, admin-only.
- No mobile native app. Allan is notified via Telegram bot.
- No vector DB / embeddings. Resume data is small (~30-50KB); inject directly into the system prompt with Anthropic prompt caching.
- No multi-provider LLM toggle. Claude Haiku 4.5 only.

## 3. Audience split

Two distinct landing pages:

- **`/`** — employer-first portfolio. Default landing. Goal: get them to recognize Allan ships AI things and reach out.
- **`/services`** — client-facing storefront. Replaces `/pricing`. Goal: surface packages and start booking flow.

Header nav surfaces both. No clever toggling, no audience switcher. Cleanest IA.

## 4. Public route changes

| Route | Action | Notes |
|---|---|---|
| `/` | Restructure | New section order, chatbot in hero |
| `/experience` | **Remove**, redirect to `/#experience` | Section on `/` |
| `/education` | **Remove**, redirect to `/#education` | Section on `/` |
| `/certifications` | **Remove**, redirect to `/#certifications` | Section on `/` |
| `/projects` | Keep | Index page |
| `/project/[slug]` | Keep | Detail pages |
| `/services` | **New** | Replaces `/pricing` |
| `/pricing` | **Remove**, 308 redirect to `/services` | Permanent redirect |
| `/book/[packageSlug]` | Keep | Booking flow |
| `/contact` | Keep | |
| `/posts`, `/[slug]` | Keep only if blogging ≥ monthly | Otherwise remove |
| `/search` | **Remove** | Chatbot replaces this |

Result: 11 → 6 routes (or 8 with blog).

Header nav: **Work · Services · Contact** (+ Blog if kept).

## 5. Payload collection changes

| Collection | Action |
|---|---|
| `Experiences`, `Educations`, `Certifications`, `Projects`, `ResumeProfiles` | Keep |
| `Companies` | Investigate; if < 20 entries, convert to select field on `Experiences` |
| `Pages` | Keep only if used; otherwise remove |
| `Posts`, `Categories` | Remove if not blogging |
| `Media` | Keep |
| `Packages`, `Customers`, `Bookings`, `AvailabilityRules` | Keep |
| `Generations`, `JobAds` | Keep, **enforce admin-only access** |
| **`ChatSessions`** (new) | Add |
| **`ChatMessages`** (new) | Add |

Globals:
- `Header`, `Footer`, `SiteSettings` — keep
- `ResumeProfile` (global) — keep, single source of truth
- `ResumeProfiles` (collection) — investigate duplication; likely remove or repurpose
- `CoverLetterSettings`, `AIGenerationSettings` — keep, admin-only

Templates:
- `default/` — **delete** (unused; `rainbow` is active)
- `rainbow/` — refactor for new homepage structure
- Template registry — keep

## 6. Homepage (`/`) structure

Section order:

1. **Hero** — headline badge, animated H1, description (existing). Plus:
   - Primary CTAs (`View work` / `Hire me`).
   - **Chat input** replacing the current `SearchBar` ("Ask me anything about my work…").
   - Conversation expands inline below the input when used. Hero stays put; messages stack downward.
2. **Credibility strip** (new, thin) — Lighthouse 99 badge, TypeScript badge, "Open source ↗" link to this repo.
3. **Featured Work** — existing section, **beefed-up cards**: title, problem solved, tech badges, [Live demo ↗], [Code ↗].
4. **Experience** — compact inline section (was `/experience`). Collapsed by default with "Show all".
5. **Education + Certifications** — compact, side-by-side.
6. **CTA block** — dual path: "Hiring? [Email me]   Need help shipping? [Services]"
7. **Footer** — existing + GitHub link to this site's repo.

## 7. Chatbot architecture

### 7.1 LLM and provider

- **Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`).
- **Provider:** Anthropic SDK (`@anthropic-ai/sdk`).
- **Caching:** Prompt caching enabled on the system prompt (the entire resume data block). Cache TTL 5 min; cache write `$1.25/M`, cache read `$0.10/M` (~90% off cached input).

### 7.2 RAG strategy: prompt-stuffed, no vector DB

System prompt assembled at request time from Payload Local API:

```
You are Allan's portfolio assistant. Answer questions about Allan's work, experience, projects, education, certifications, and services. Be concise. If asked something outside Allan's scope, politely redirect.

# Profile
{ResumeProfile global: name, headline, summary, heroDescription, contact}

# Experience
{Experiences: title, company, dates, summary, highlights}

# Education
{Educations: degree, school, dates}

# Certifications
{Certifications: name, issuer, date, category}

# Projects
{Projects: title, slug, problem, outcome, techStack, liveUrl, repoUrl}

# Services (high-level)
{Packages: name, slug, summary, priceRange}
```

Estimated size: ~7,500 tokens (well under 200K context). Whole block is `cache_control: ephemeral` so subsequent turns hit cache.

### 7.3 API route

`POST /api/chat` (Edge runtime).

Request: `{ sessionId: string, messages: { role, content }[], turnstileToken: string }`
Response: streamed text via `ReadableStream` (Server-Sent Events or chunked transfer).

Server flow:
1. Verify Cloudflare Turnstile token.
2. Rate-limit check (see 7.5).
3. Load/create `ChatSessions` row.
4. Persist incoming user message to `ChatMessages`.
5. Call Anthropic with system prompt (cached) + conversation history.
6. Stream tokens to client; on completion persist assistant message.
7. Run high-intent classifier (see 7.6) on the new turn; if signal, fire Telegram alert.

### 7.4 Client UI

- New component `src/templates/rainbow/components/Chat.tsx` (`'use client'`).
- Loaded via `next/dynamic(() => import(...), { ssr: false })` from the Hero.
- Input component renders immediately as a styled `<input>` (no JS cost). Real chat module loads on input focus to preserve LCP.
- Messages render as a stacked list under the input. Pre-allocate min-height to avoid CLS.
- Streaming via fetch + `ReadableStreamDefaultReader`. No Vercel AI SDK dependency.

### 7.5 Rate limiting & abuse prevention

- **Cloudflare Turnstile** invisible challenge on every `POST /api/chat`.
- **Per-session message cap:** 5 messages per session, sliding window.
- **Per-IP daily cap:** 20 messages/day.
- **Token budget cap:** 10,000 output tokens/session.
- **Storage:** Upstash Redis (free tier) keyed by `session_id` and IP.
- **On limit hit:** return a structured "limit reached" payload, NOT an error. Client renders a CTA card:
  > "I've answered 5 questions for you — that's my limit per session. To keep talking, [book a 15-min call] or [email Allan]."

### 7.6 High-intent detection + Telegram alerts

After each assistant response, run a lightweight classifier on the user's most recent message. v1: keyword + heuristic match (no LLM). Trigger signals:

- Pricing/hiring keywords: `price|pricing|cost|rate|budget|hire|hiring|available|availability`
- Contact intent: visitor leaves email, phone, or asks "how do I reach you"
- Engagement threshold: conversation crosses 4 turns
- Rate-limit hit (visitor wanted more)

On trigger, send Telegram message via `sendMessage` HTTPS API:

```
💬 New high-intent chat
Signal: pricing-question
Last msg: "What does the Starter package cost?"
Session: abc123 (8 msgs)
View → https://allan.dev/admin/collections/chat-sessions/abc123
```

Telegram bot setup:
- Use existing personal Telegram account.
- New bot via @BotFather → save `TELEGRAM_BOT_TOKEN`.
- Get `TELEGRAM_CHAT_ID` (Allan's user ID, or a private channel).
- Server-side fetch to `https://api.telegram.org/bot<token>/sendMessage`. No SDK needed.

### 7.7 New Payload collections

**`ChatSessions`**

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `ipAddress` | text | For rate limiting + identification |
| `userAgent` | text | |
| `startedAt` | timestamp | |
| `lastMessageAt` | timestamp | |
| `messageCount` | number | Denormalized counter |
| `leadStatus` | select | `new`, `contacted`, `qualified`, `cold` |
| `capturedEmail` | text (optional) | If chatbot extracts email from conversation |
| `capturedName` | text (optional) | |
| `intentSignals` | array of text | Triggers that fired (pricing, hiring, contact, etc.) |

Access: admin-only.

**`ChatMessages`**

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `session` | relationship → `ChatSessions` | |
| `role` | select | `user`, `assistant` |
| `content` | text | Plain text. Markdown rendered client-side. |
| `createdAt` | timestamp | |
| `tokenCount` | number (optional) | For cost tracking |

Access: admin-only.

## 8. Performance budget (Lighthouse 99 preservation)

Rules — non-negotiable:

1. **No Anthropic SDK on the client.** All Claude calls go through `/api/chat`.
2. **Lazy-load `Chat.tsx`** via `next/dynamic({ ssr: false })`. Chat module not on critical path.
3. **Edge runtime** for `/api/chat`: `export const runtime = 'edge'`.
4. **Stream via plain `ReadableStream`** — no AI SDK dependency.
5. **All non-chat sections stay Server Components.** Hero shell, projects, experience: RSC.
6. **Pre-allocate chat container height** to avoid CLS.
7. Existing patterns kept: `next/image` AVIF, `next/font` with `display: swap`.

Target: Lighthouse ≥ 97 desktop after launch (current: 99). If we drop below 97, performance budget is failed.

## 9. Environment variables (new)

```
ANTHROPIC_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Add to `.env.example` and document in `docs/`.

## 10. Files to create / modify

### New
- `src/app/api/chat/route.ts` — chat endpoint (Edge runtime)
- `src/app/services/page.tsx` — services storefront (replaces `/pricing`)
- `src/collections/ChatSessions.ts`
- `src/collections/ChatMessages.ts`
- `src/templates/rainbow/components/Chat.tsx` — client chat UI
- `src/templates/rainbow/components/CredibilityStrip.tsx`
- `src/lib/anthropic.ts` — Claude client + prompt builder
- `src/lib/telegram.ts` — Telegram alert helper
- `src/lib/rate-limit.ts` — Upstash-backed limiter
- `src/lib/intent-classifier.ts` — keyword-based signal detector
- `docs/CHATBOT.md` — usage + architecture
- `docs/TELEGRAM_ALERTS.md` — bot setup runbook

### Modified
- `src/templates/rainbow/HomePage.tsx` — new section order
- `src/templates/rainbow/components/Hero.tsx` — replace SearchBar with chat input
- `src/templates/rainbow/components/FeaturedWork.tsx` — add tech badges + live demo links
- `src/templates/rainbow/components/ProjectCard.tsx` — beefed-up card
- `src/Header/Component.tsx` (or rainbow Header) — nav: Work · Services · Contact
- `src/payload.config.ts` — register new collections
- `src/payload-types.ts` — regenerate via `pnpm generate:types`
- `next.config.mjs` — redirects for `/experience`, `/education`, `/certifications`, `/pricing`, `/search`
- `src/app/(frontend)/pricing/page.tsx` — removed (redirected)
- `src/app/(frontend)/search/page.tsx` — removed
- `src/app/(frontend)/experience/page.tsx`, `education/`, `certifications/` — removed
- `src/templates/default/` — delete (unused template)
- `.env.example` — new env vars
- `PLAN.md` — append new phases
- `README.md` — update feature list and architecture diagram
- `CHANGELOG.md` — entry for this work
- `CLAUDE.md` — note new collections, new env vars, chatbot endpoint

## 11. Acceptance criteria

- [ ] `/`, `/services`, `/projects`, `/project/[slug]`, `/contact`, `/book/[packageSlug]` all render correctly.
- [ ] Old routes (`/experience`, `/education`, `/certifications`, `/pricing`, `/search`) issue 308 redirects.
- [ ] Chatbot answers questions about Allan's data correctly (manual smoke: 10 questions covering profile, projects, experience, certifications, services).
- [ ] Rate limiting blocks the 6th message per session and the 21st per IP/day with a CTA card.
- [ ] Telegram alert fires when visitor asks a pricing question, leaves an email, or hits the rate limit.
- [ ] Lighthouse desktop score ≥ 97 on `/`.
- [ ] No Anthropic SDK present in client bundle (verify with `next build` analyzer).
- [ ] Chat input visible in hero on initial paint without chat module loaded (SSR test).
- [ ] All new env vars documented in `.env.example`.
- [ ] `pnpm exec tsc --noEmit` clean. `pnpm lint` clean.
- [ ] Tests: integration test for `/api/chat` rate limiting; unit test for intent classifier.

## 12. Open questions

1. **`Posts`/`Pages`/`Categories`:** confirm if they should be removed or kept. (Default: cut unless blogging.)
2. **`Companies` collection:** how many entries? If < 20, convert to select field.
3. **`ResumeProfiles` collection vs `ResumeProfile` global:** what's the actual difference? Likely deduplicate.
4. **Telegram bot:** does Allan want to create a fresh bot or reuse existing? (Default: fresh bot for this site.)
5. **Blog: keep or cut?** Affects nav and route count.

## 13. Phasing

Two implementation phases, sequenced:

- **Phase A — Site restructuring (no chatbot yet).** Routes consolidated, redirects in place, services page live, Payload collections cleaned, homepage sections reorganized, default template deleted. Lighthouse re-tested.
- **Phase B — Chatbot.** ChatSessions/ChatMessages collections, `/api/chat`, hero chat input, rate limiting, Telegram alerts, intent classifier.

Each phase ships independently. Phase A unblocks the homepage layout that Phase B drops the chat into.
