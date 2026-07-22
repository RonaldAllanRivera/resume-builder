# AI Blog Generation + Blog Page — Design

**Date:** 2026-07-22
**Status:** Awaiting review
**Depends on:** `2026-07-22-seo-foundation-design.md` (ships first)

---

## Problem

Allan wants to paste a topic into the Payload admin and get a draft blog post
written in his own voice, using a style prompt he maintains in the admin. He has
both Anthropic and OpenAI API keys.

Two things about the current state shape this design:

1. **The blog page already exists and works.** `src/app/(frontend)/posts/page.tsx`
   has archive, `PageRange`, and `Pagination`; `posts/[slug]/page.tsx` renders
   detail. It shows nothing because there are **zero published posts**, not
   because it is unbuilt. This is a *styling* job, not a build-from-scratch — it
   is still the unstyled Payload template and does not match the rainbow theme.

2. **The exact pattern needed already exists.** `src/AIGenerationSettings/config.ts`
   stores prompts as editable admin fields with code-default constants;
   `src/components/Globals/AIGenerationSettingsResetButton/index.tsx` is a custom
   admin button calling a `/next/*` route. This design mirrors that rather than
   inventing a parallel system.

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Provider | Anthropic (Claude) | Better at sustained personal voice; `ANTHROPIC_API_KEY` already wired for receipt OCR. OpenAI stays on résumé generation — CLAUDE.md documents this two-provider split as deliberate |
| SDK | `@anthropic-ai/sdk` (already a dependency at `^0.111.0`) | Never raw `fetch` for Anthropic calls. `src/lib/receipt-ocr.ts` already uses the SDK |
| Default model | `claude-sonnet-5` | Admin-selectable |
| Publish behavior | Always `draft`, never auto-publish | Google's spam policy targets *scaled content abuse*. AI assistance is fine; unedited AI publishing at volume is the pattern that gets sites demoted |
| Batch generation | Deliberately **not** built | See "Volume is a non-goal" below |

### Model choice — why cost is not the deciding factor

At 2 posts/month × ~2,000 output tokens:

| Model | Model ID | Output $/1M | Per post | Per year |
|---|---|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5` | $5 | ~$0.01 | ~$0.24 |
| Sonnet 5 | `claude-sonnet-5` | $15 ($10 intro thru 2026-08-31) | ~$0.02 | ~$0.48 |
| Opus 4.8 | `claude-opus-4-8` | $25 | ~$0.05 | ~$1.20 |

Choosing a weaker model to save ~$1/year on the one artifact whose entire purpose
is sounding like Allan is a false economy.

The *technical* argument matters more than the cost one. **Haiku 4.5 is an
older-generation model with a different thinking API**: it uses
`thinking: {type: "enabled", budget_tokens: N}` and **errors** if passed the
`effort` parameter. Sonnet 5 and Opus 4.8 use `thinking: {type: "adaptive"}` +
`output_config: {effort}`. Since the model is admin-selectable, the request
builder must branch on this — see Component 3.

**Recommendation:** Sonnet 5 day-to-day; Opus 4.8 for a cornerstone piece.

### Volume is a non-goal

The companion SEO spec calls for 1–2 *good* posts a month, and identifies an
empty `/posts` as a mild negative signal — but a flooded `/posts` as a much worse
one. The purpose of this tool is to make a small number of good posts *faster to
write*, not to make many posts *possible*. No bulk or queued generation is in
scope, and that omission is intentional, not an oversight.

---

## Architecture

Two components in the admin, one on the frontend.

### Component 1 — `BlogGenerationSettings` global

Admin-only (`adminOnly` access), mirroring `AIGenerationSettings`.

| Field | Type | Notes |
|---|---|---|
| `stylePrompt` | textarea | Allan's writing-style prompt — the thing he pastes in |
| `systemPrompt` | textarea | Role, constraints, output contract |
| `model` | select | `claude-sonnet-5` (default), `claude-opus-4-8`, `claude-haiku-4-5` |
| `effort` | select | `low`/`medium`/`high`/`xhigh`/`max`; ignored for Haiku |
| `maxTokens` | number | Default 8000 |
| `targetWordCount` | number | Default 1200 |

Code-default constants exported from the config file plus a "Reset to defaults"
button, exactly as `AIGenerationSettings` does today.

**A select, not free text, for `model`** — a typo in a free-text model ID produces
a 404 from the API at generation time with no validation feedback.

### Component 2 — `BlogDrafts` collection

Admin-only. The generation workspace.

| Field | Purpose |
|---|---|
| `topic` | The pasted topic (required) |
| `notes` | Optional steering |
| `status` | `idle` → `generating` → `ready` \| `error` |
| `generatedTitle`, `generatedSlug`, `generatedMetaDescription` | SEO metadata |
| `generatedMarkdown` | The draft body |
| `errorMessage`, `model`, `generatedAt` | Diagnostics |
| `createdPost` | Relationship to the Post created from this draft |

Storing generations as rows rather than firing straight into a Post keeps
history, allows regeneration without destroying work, and makes failures
inspectable. This mirrors how `Generations` already works.

### Component 3 — Two admin buttons, two endpoints

Split deliberately: the markdown is reviewed **before** anything enters the Posts
collection.

**`POST /next/generate-blog-post`**

Reads settings + the draft row, calls Claude, writes results back. Returns
structured output so title/slug/meta/body arrive as validated fields rather than
requiring the response to be parsed out of prose.

Thinking-config branch — the reason `model` selection has real code impact:

```ts
const isLegacyThinking = model === 'claude-haiku-4-5'

const thinkingConfig = isLegacyThinking
  ? { type: 'enabled' as const, budget_tokens: 2000 }   // must be < maxTokens
  : { type: 'adaptive' as const }

// `effort` is only sent for adaptive-thinking models; Haiku 4.5 errors on it.
const outputConfig = isLegacyThinking ? undefined : { effort }
```

**`POST /next/blog-draft-to-post`**

Converts markdown → Lexical, creates a **draft** Post with title, slug, and meta
populated, links it back to the BlogDraft, returns a link.

### The main technical risk — markdown → Lexical

`Posts.content` is a Lexical `richText` field storing editor JSON. Claude outputs
markdown. **Nothing in this codebase currently performs that conversion** — a
repo-wide grep for `convertMarkdownToLexical` / `editorConfigFactory` returns
nothing.

`@payloadcms/richtext-lexical` ships `convertMarkdownToLexical`, but it requires
the editor config resolved via `editorConfigFactory`, and the Posts editor has a
**non-default feature set** (`HeadingFeature`, `BlocksFeature` with Banner/Code/
MediaBlock, `FixedToolbarFeature`, `InlineToolbarFeature`, `HorizontalRuleFeature`).
Converting against the wrong config produces a document the editor cannot render.

**This is proven with a test before any UI is built on top of it.** The
implementation plan must order it first: a passing integration test that converts
representative markdown (headings, lists, fenced code, links, bold/italic) into
Lexical JSON that round-trips through the Posts editor config. If the helper
cannot reproduce the custom blocks, the fallback is to convert only standard
markdown and let Allan add Banner/Code/MediaBlock blocks by hand in the editor —
but that is a decision to make *after* the test, not before.

### Component 4 — Blog page styling

- Restyle `/posts`, `/posts/[slug]`, and `CollectionArchive` to match the rainbow
  template
- Add `BlogPosting` JSON-LD: `headline`, `author`, `datePublished`,
  `dateModified`, `image`. This is what makes posts eligible for rich results and
  is heavily used by AI answer engines
- Add reading time, publish date, categories
- Add contextual internal links to `/services` (Section 7d of the SEO spec)
- Posts flow into the sitemap via Section 2 of the SEO spec — no extra work here

---

## Security

| Concern | Handling |
|---|---|
| API key exposure | Server-side only. Never returned to the admin client |
| Endpoint access | `adminOnly` on both routes; reject non-admin with 403 |
| Abuse / runaway cost | Rate limit both routes, reusing the pattern in `/api/bookings/proof` |
| Runaway generation | Request timeout; `maxTokens` cap enforced server-side, not trusted from the client |
| Input bounds | `topic` and `notes` length-capped before reaching the API |
| Transaction safety | Pass `req` to nested Payload operations so they share the transaction (CLAUDE.md requirement) |
| Prompt injection via topic | The topic is Allan's own input, not third-party — low risk. Still, the system prompt states the topic is content to write about, not instructions to follow |

---

## Testing

| Test | Asserts |
|---|---|
| **Markdown → Lexical (first)** | Headings, lists, fenced code, links, emphasis round-trip through the Posts editor config |
| Request builder | Haiku 4.5 gets `budget_tokens` and **no** `effort`; Sonnet 5 / Opus 4.8 get `adaptive` + `effort` |
| Access control | Non-admin gets 403 on both endpoints |
| Draft-to-post | Creates a Post with `_status: 'draft'` — never `published` |
| Error path | API failure sets `status: 'error'` and populates `errorMessage`; no partial Post created |
| Blog page | `BlogPosting` JSON-LD present and valid on `/posts/[slug]` |

No test may make a live Anthropic API call — the Anthropic client is mocked, in
line with the existing suite's no-live-calls rule (see commit `0d4d473`, which
stopped the booking suites sending live email).

---

## Out of scope

- Bulk / batch / queued generation (deliberate — see "Volume is a non-goal")
- Auto-publishing
- AI-generated hero images
- Replacing OpenAI in the résumé/cover-letter workflow
- Editing published posts via AI

---

## Risks

| Risk | Mitigation |
|---|---|
| Lexical conversion does not reproduce custom blocks | Prove with a test first; documented fallback is standard-markdown-only conversion with manual block insertion |
| Generated posts read as generic AI content and hurt rankings | Draft-only, mandatory human edit pass, no bulk generation, 1–2 posts/month cadence |
| Style prompt underperforms | It is admin-editable and iterable without a deploy — that is the point of storing it in a global |
| Model IDs change | Kept in one code-default constant; a select field means updating one list |
| Anthropic SDK version drift | `^0.111.0` is already installed and used by receipt OCR; no upgrade required |
