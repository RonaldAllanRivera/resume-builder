# Remove Stripe, add the accept-and-invoice flow

**Date:** 2026-07-13
**Status:** Approved (revised after code audit), pending implementation

## Problem

The booking system on allanai.dev was built to settle payment through Stripe Checkout. Stripe is
not available as a payment rail for this business (the site operates in `Asia/Manila`).

**A code audit revealed the Stripe integration is already dead code.** `POST /api/bookings/checkout`
has zero callers: `BookingFlow.tsx` submits to `/api/bookings` and renders an inline confirmation
without ever creating a checkout session. Because no session is ever created, the Stripe webhook
can never fire, and `/book/success` and `/book/cancel` — reachable only via a Stripe redirect — are
unreachable pages. `src/lib/stripe.ts` is imported solely by those two orphaned routes.

So the live flow is **already payment-free**, and removing Stripe is a dead-code sweep with no
user-visible change.

The real gap this exposes: once a booking lands in `pending_review`, **nothing in the system moves
it forward.** There is no accept step, no invoice, no payment path. That is the actual problem
worth solving.

## Goal

1. Delete the dead Stripe code, dependency, fields, and docs.
2. Close the gap: give the admin an accept-and-invoice flow. Accepting a booking emails the client
   payment instructions; the admin marks it paid by hand when the money arrives out of band.

Non-goals: replacing Stripe with another processor (PayMongo, Xendit, Paddle), and removing the
booking system altogether. Both were considered and rejected.

## Current state

**Dead Stripe code (delete):**

| Path                                     | Why it's dead                                    |
| ---------------------------------------- | ------------------------------------------------ |
| `src/app/api/bookings/checkout/route.ts` | Zero callers                                     |
| `src/app/api/webhooks/stripe/route.ts`   | Only fires for a checkout session never created; sole file under `src/app/api/webhooks/` |
| `src/lib/stripe.ts`                      | Imported only by the two routes above            |
| `src/app/(frontend)/book/success/page.tsx` | Reachable only via Stripe redirect             |
| `src/app/(frontend)/book/cancel/page.tsx`  | Reachable only via Stripe redirect             |
| `stripe@^22.0.0` in `package.json`       | Used only by `src/lib/stripe.ts`                 |
| `docs/STRIPE.md`                         | Documents a removed integration                  |

**Working and untouched:** `BookingFlow.tsx` (already renders an inline success state),
`PricingPage.tsx`, `/services`, `/book/[packageSlug]`, `POST /api/bookings`,
`GET /api/availability/slots`, and the `Packages` / `Customers` / `AvailabilityRules` / `Bookings`
collections.

**Dead env vars:** `NEXT_PUBLIC_BOOKING_ENABLED` and `BOOKING_PAYOUT_MODE` are declared in
`.env.example` and read by no code.

**Database:** No migrations exist in `src/migrations/` — Payload runs in push mode. Production holds
no real bookings or customers, so dropping columns is safe.

## Design

### 1. Field and enum removals

| Location   | Field                     |
| ---------- | ------------------------- |
| `Packages` | `stripePriceId`           |
| `Packages` | `stripeProductId`         |
| `Bookings` | `stripeCheckoutSessionId` |
| `Bookings` | `stripePaymentIntentId`   |

Drop the `payment_released` value from `Bookings.status`. It models Stripe Connect escrow payout and
means nothing once payment settles out of band.

**Keep every other status value** — `pending_review`, `accepted`, `pending_payment`, `paid`,
`in_progress`, `work_completed`, `cancelled`, `expired`, `refunded`, `disputed`. Only
`payment_released` is Stripe-specific.

**Keep** `Bookings.paymentMode` (`pay_after_completion` / `pay_upfront` / `deposit_final`),
`depositAmount`, `refundAmount`, and `refundReason`. Deposits and refunds are business decisions,
not Stripe ones, and survive the rail change intact.

### 2. New `BookingSettings` global

`src/BookingSettings/config.ts`, following the existing convention (`src/SiteSettings/`), registered
in `payload.config.ts` under `globals`. Access: **`read: adminOrEditor`**, `update: adminOrEditor`.

> **Corrected during implementation.** This originally specced `read: () => true` (mirroring
> `SiteSettings`). That was wrong and shipped a HIGH-severity defect: it exposed
> `paymentInstructions` — bank account and GCash details — to unauthenticated `GET
> /api/globals/booking-settings`. `SiteSettings` holds branding; this holds banking. Every consumer
> reads the global server-side through Payload's Local API, which bypasses REST access control, so
> locking `read` down breaks nothing.

| Field                 | Type     | Purpose                                                                 |
| --------------------- | -------- | ----------------------------------------------------------------------- |
| `bookingEnabled`      | checkbox | Kill switch, default `true`. When off, `POST /api/bookings` rejects with 503. Gives the dead `NEXT_PUBLIC_BOOKING_ENABLED` a real home. |
| `paymentInstructions` | textarea | Bank details, GCash, invoice terms. Rendered into the payment email with newlines converted to `<br>`. |
| `paymentTermsSummary` | text     | One line shown on the booking form, setting expectations before submit.  |
| `notificationEmail`   | email    | Optional override for `BOOKING_NOTIFICATION_EMAIL`. Business config, not a secret. |

`paymentInstructions` is a **textarea, not richText**: rendering Lexical to email-safe HTML needs a
converter and carries real edge cases, while bank details are plain text.

### 3. Lifecycle and the `afterChange` hook

```
pending_review → accepted → pending_payment → paid → in_progress → work_completed
```

`pending_review` is set by `POST /api/bookings`. Every subsequent transition is driven by the admin
in the Payload admin panel.

**The payment-instructions email fires on entry to `pending_payment`, not on `accepted`.** The email
*is* the invoice, so it fires exactly when payment is declared due. Firing it on `accepted` would
force the two states to always coincide and make one redundant. Moving a booking straight from
`pending_review` to `pending_payment` is a supported one-click path; `accepted` remains available
for "agreed in principle, still scoping."

A single `afterChange` hook on `Bookings` (`src/collections/Bookings/hooks/sendStatusEmails.ts`):

| Transition into   | Sends                                   |
| ----------------- | --------------------------------------- |
| `pending_payment` | `sendPaymentInstructionsEmail` (new)    |
| `paid`            | `sendPaymentConfirmedEmails` (existing) |

The hook:

- Guards on `previousDoc.status !== doc.status`, so re-saving a document never re-sends an email.
- Passes `req` to every nested Payload operation so they share the transaction (per CLAUDE.md).
- Is fire-and-forget: an email failure must never roll back the status change.

`sendPaymentConfirmedEmails` already exists and is currently reachable only from the Stripe webhook.
It survives; it gets a new caller.

### 4. Frontend

**`BookingFlow.tsx` needs no rewiring** — it already posts to `/api/bookings` and renders an inline
success state. The only change: render `paymentTermsSummary` from `BookingSettings` on the form so
the client knows payment comes by invoice before they submit.

`/book/success` and `/book/cancel` are deleted as dead routes. Neither is linked from anywhere in
`src/`; both were Stripe redirect targets only. No redirect entries are needed, but a 308 from
`/book/success` and `/book/cancel` to `/services` is added to `redirects.js` as cheap insurance
against any external link.

`PricingPage.tsx` CTAs are unchanged (they already read "Book" / link to `/book/<slug>`, not
"Book & pay").

### 5. Emails

`src/lib/booking-email.ts`:

- `sendBookingRequestEmails` — unchanged.
- `sendPaymentInstructionsEmail(customer, booking, opts)` — **new**. Customer only. Renders
  `paymentInstructions` plus the amount, booking reference, and package name.
- `sendPaymentConfirmedEmails` — retained, now called by the hook.
- `getAdminEmail(override?: string)` — gains an optional override so `BookingSettings.notificationEmail`
  can supersede the env var. Env remains the fallback.

### 6. Environment and docs

Remove from `.env.example` and Vercel: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `BOOKING_PAYOUT_MODE` (dead), `NEXT_PUBLIC_BOOKING_ENABLED` (dead,
superseded by `BookingSettings.bookingEnabled`).

Keep `BOOKING_NOTIFICATION_EMAIL` (now a fallback), `BOOKING_TIMEZONE`, `BOOKING_BUFFER_MINUTES`,
`BOOKING_CONFIRMATION_HOURS`, `BOOKING_ADVANCE_NOTICE_DAYS`, `RESEND_API_KEY`.

Delete `docs/STRIPE.md`. Rewrite `docs/BOOKING_SYSTEM.md` and the Booking System section of
`CLAUDE.md` — including removing the `stripe listen --forward-to` instruction.

## Testing

The booking system has **no test coverage today**. The `afterChange` hook becomes the only thing
standing between an accepted booking and a client who never receives payment details, so it must be
tested.

Integration (`tests/int/booking.int.spec.ts`, test DB on port 5433, Resend mocked via `vi.mock`):

1. `POST /api/bookings` creates a booking with status `pending_review`.
2. `pending_review → pending_payment` sends exactly one email, containing the `paymentInstructions`
   text from `BookingSettings`.
3. `pending_payment → paid` sends exactly one payment-confirmed email.
4. Re-saving a booking without changing status sends **no** email (idempotency).
5. With `bookingEnabled` false, `POST /api/bookings` returns 503.

E2E (`tests/e2e/booking.e2e.spec.ts`): `/services` renders active packages → `/book/[slug]` submits a
request → the inline confirmation appears.

Static check: `grep -ri stripe src/` returns nothing once `pnpm generate:types` has regenerated
`payload-types.ts`.

## Risks

- `payload-types.ts` will churn substantially. It is generated — never hand-edit it.
- Docker-first: do not run `pnpm build` or remove `.next` on the host while the `resume-builder-app`
  container is running.
- Push mode alters the schema on boot. Confirmed safe: no real booking data in production.

---

# Amendment — Payment proof + Claude vision OCR

**Added:** 2026-07-13, after the plan began executing (Task 1 complete).

## Why

Out-of-band payment leaves one question unanswered: *did they actually pay?* The client will want
to send a GCash/bank screenshot; the admin wants to not retype reference numbers.

## The threat model — read this first

**A screenshot is not proof of payment.** It is a picture. It can be edited, and fake GCash receipt
generators are a commodity scam tool in the Philippines. OCR extracts *what the image claims*, never
*whether money moved*.

Therefore, as a hard rule: **OCR output must never write `paid`.** Ground truth is the admin's own
GCash/bank app. The extraction is a data-entry aid and an audit trail — nothing more. The admin
confirms payment by looking at their own account and clicking a button.

The extracted text is also **untrusted client input** (an image can carry adversarial text aimed at
the model). Because it never drives a status transition, the blast radius is confined to a wrong
value displayed to the admin, who is verifying against their own bank anyway.

## Lifecycle

```
pending_review → accepted → pending_payment → payment_submitted → paid → in_progress → work_completed
```

`payment_submitted` is new: the client has uploaded proof, and the admin has not yet confirmed it
against their own account. It is a *claim*, not a fact.

## Schema

New collection `PaymentProofs` (`src/collections/PaymentProofs.ts`) — an upload collection,
`read/update/delete: adminOrEditor`, `create: anyone` (clients are unauthenticated).

**Not the `media` collection**: `media` is publicly readable, and a payment receipt carries the
client's name and partial account numbers.

> ⚠️ **Known limitation, accepted:** `vercelBlobStorage` serves blobs from unguessable but
> **public** URLs. Payload's access control protects the *metadata*, not the blob bytes. Proofs
> should be purged once a booking settles. If this is unacceptable, the alternative is to extract
> the fields and discard the image entirely.

New fields on `Bookings`:

| Field                  | Type     | Notes                                                        |
| ---------------------- | -------- | ------------------------------------------------------------ |
| `paymentProof`         | upload   | → `paymentProofs`                                            |
| `proofExtracted`       | group    | `amountMinor`, `currency`, `referenceNumber`, `senderName`, `paidAt`, `channel`, `isReceipt` |
| `proofAmountMatches`   | checkbox | Read-only. Computed: does `proofExtracted.amountMinor` equal `Bookings.amount`? |

Every `proofExtracted` field is admin-readonly. They are a machine's reading of a client's claim.

## Extraction

`src/lib/receipt-ocr.ts` — `extractReceipt(image: Buffer, mediaType: string): Promise<ReceiptExtraction>`

Uses **Claude vision + structured outputs** via `@anthropic-ai/sdk`, model `claude-opus-4-8`, with
`client.messages.parse()` and a Zod schema (`zodOutputFormat`). Classical OCR (Tesseract) is
rejected: receipt screenshots vary wildly in crop, chrome, and quality, which is exactly where it
fails and a vision model does not. Requires `ANTHROPIC_API_KEY`.

The resume generator stays on OpenAI for now; this is a deliberate second provider, not an
oversight.

## Flow

1. The payment-instructions email carries an upload link.
2. The client uploads → `POST /api/bookings/proof` creates a `PaymentProofs` doc, runs
   `extractReceipt`, writes `proofExtracted` + `proofAmountMatches`, sets status
   `payment_submitted`.
3. The `afterChange` hook emails the **admin**: "client submitted proof, review it." The client gets
   no confirmation at this point — nothing has been confirmed.
4. The admin sees the extracted values beside the expected amount, with a loud mismatch warning,
   checks their own GCash/bank app, and sets the status to `paid`.
5. `paid` fires the existing confirmation email.

## Stronger verification (recommended follow-up, not in this plan)

Ask clients to put the booking reference (`#42`) in the GCash message field, then parse the
notification email that **GCash/the bank sends the admin**. That message originates from the payment
provider rather than the client, so it cannot be forged by them — real verification, no processor
integration. Worth its own spec.
