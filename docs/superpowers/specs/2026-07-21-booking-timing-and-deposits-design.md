# Booking lead time, deposits, and payment deadlines

**Date:** 2026-07-21
**Status:** Approved, pending implementation plan
**Follows:** `2026-07-13-remove-stripe-booking-design.md` (the accept-and-invoice flow this builds on)

## Problem

The booking system has a minimum-lead-time setting and a payment flow, but three things are wrong
with how they fit together.

**1. The lead time is not enforced.** `AvailabilityRules.advanceNoticeDays` (default 7) is checked
only in `GET /api/availability/slots`, the endpoint that decides which times the calendar offers. The
submission endpoint `POST /api/bookings` checks only `startDate <= new Date()` ("must be in the
future"). So the calendar hides dates inside the window, but a direct POST with `startAt` set to
tomorrow is accepted and creates a real booking. The lead time is a UI convention, not a rule.

**2. The payment policy is inverted.** `POST /api/bookings` derives `paymentMode` from
`pkg.durationType`:

```ts
let paymentMode = 'pay_after_completion'
if (pkg.durationType === 'call')  paymentMode = 'pay_upfront'
else if (pkg.durationType === 'month') paymentMode = 'deposit_final'
```

This marks the **consultation as prepaid** and **day/week delivery work as paid after completion** —
the opposite of how the business actually runs. It also contradicts the lifecycle
(`pending_payment → paid → in_progress → work_completed`), which assumes money lands before work
starts.

**3. Nothing protects the admin's verification window.** Payment settles out of band (bank transfer /
GCash) and the admin confirms it by checking their own account. But a lead time alone does not
reserve time for that check: a client can book 7 days out and pay on day 6, leaving one day to
verify. The lead time and the payment deadline are two different clocks, and only one exists.

Separately, four settings are dead: the env vars `BOOKING_ADVANCE_NOTICE_DAYS`,
`BOOKING_BUFFER_MINUTES`, and `BOOKING_CONFIRMATION_HOURS` are read by no code (the live values are
fields on `AvailabilityRules`), and `AvailabilityRules.confirmationWindowHours` describes itself as
*"Hours you have to confirm/review a booking before it auto-expires"* — auto-expiry that does not
exist. The `expired` status on `Bookings` is likewise never set by any code, and there is no cron
anywhere in the project.

## Goal

Make the lead time a real rule, encode the actual payment policy, and give the admin a guaranteed
window to verify money landed before committing time.

Non-goals: automatic expiry of unpaid bookings (explicitly rejected — see Decisions), and any
payment-processor integration.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Consultation payment | **None to book** | The consult is the sales conversation; friction there costs leads. |
| Paid-package payment | **Flat 50% deposit** on every paid package, balance invoiced afterward | One uniform rule is simplest to explain to clients and to implement. Splits risk the way freelance work normally does. |
| Missed deadline | **Nothing automatic** — surfaced in admin for manual handling | The admin is already the manual gate for `paid`. Avoids cancelling on someone whose transfer was merely slow, and needs no cron infrastructure. |
| Timing | Consult **2 days** lead; paid work **7 days** lead; deposit due **3 days** before start | Keeps the existing 7-day default, so nothing becomes less bookable. Splits into ~4 days for the client to pay and 3 days for the admin to verify. |

The governing constraint: **lead time ≥ client payment window + admin verification buffer.**
At 7 = 4 + 3 the budget balances. If 3 days proves too tight, raise the lead time rather than
squeezing the client's window — a short payment window is what causes missed deadlines.

## Design

### 1. Payment policy

Correct the `paymentMode` derivation in `POST /api/bookings`:

| `durationType` | Current (wrong) | Corrected | `depositAmount` |
|---|---|---|---|
| `call` | `pay_upfront` | `pay_after_completion` | none |
| `day` | `pay_after_completion` | `deposit_final` | 50% of price |
| `week` | `pay_after_completion` | `deposit_final` | 50% of price |
| `month` | `deposit_final` | `deposit_final` | 50% of price |

`depositAmount` is `Math.round(pkg.price * depositPercent / 100)` in the same minor units
(centavos/cents) as `price`. Consultations get no `depositAmount` and no payment deadline; they run
`pending_review → accepted → in_progress → work_completed`, never entering `pending_payment`.

The balance (the other 50%) is invoiced manually after the work and is deliberately **outside** the
automated flow — the system tracks exactly one payment event per booking, which is what the existing
lifecycle supports.

### 2. Shared lead-time resolution

The root cause of problem 1 is that the rule lives inside one endpoint. Extract it so both callers
share it and cannot drift:

`src/lib/booking-availability.ts`

```ts
resolveAdvanceNoticeDays(pkg, rule): number   // pkg.advanceNoticeDays ?? rule.advanceNoticeDays ?? 7
findMatchingRule(rules, date): AvailabilityRule | null   // day-of-week match, ISO Mon=1..Sun=7
isWithinBookingWindow(startAt, pkg, rule, now): { ok: boolean; reason?: string; minDate: Date; maxDate: Date }
```

`GET /api/availability/slots` is refactored to use these (behaviour unchanged). `POST /api/bookings`
starts using them — this is the fix.

### 3. Lead time becomes enforceable and per-package

Add to `Packages`:

| Field | Type | Notes |
|---|---|---|
| `advanceNoticeDays` | number, **optional** | Overrides the availability rule for this package. Left empty = inherit the rule. |

Set the consultation package to `2`. Paid packages stay empty and inherit the rule's `7`.

`POST /api/bookings` gains a check, after the package lookup and before creating anything: resolve
the matching availability rule for the requested date, compute the window, and reject with **400**
and a message naming the required notice if `startAt` falls outside it. The existing "must be in the
future" check stays as a cheap guard.

If no availability rule matches the requested day, the booking is rejected — consistent with the
slots endpoint, which returns no slots in that case.

### 4. Deposit deadline

Add to the `bookingSettings` global:

| Field | Type | Default | Purpose |
|---|---|---|---|
| `depositPercent` | number | `50` | Percentage of package price required to secure the booking. |
| `depositDueDaysBeforeStart` | number | `3` | How many days before `startAt` the deposit must clear. This is the admin's verification buffer. |

Add to `Bookings`:

| Field | Type | Notes |
|---|---|---|
| `paymentDueAt` | date, admin-readOnly | Computed at creation: `startAt` − `depositDueDaysBeforeStart` days. Null for consultations. |

`paymentDueAt` is **stored, not computed on read**, so the admin list can sort and filter by it —
that is the mechanism for spotting overdue bookings — and so the invoice email can render a concrete
date.

`paymentDueAt` joins `Bookings.admin.defaultColumns`.

### 5. Invoice email states the deadline

`sendPaymentInstructionsEmail` renders the deposit amount and the deadline date, e.g.:

> Your 50% deposit (₱500.00) must clear by Friday, 8 August 2026.

Formatted with the existing `formatCurrency` / `formatDatetime` helpers in the booking timezone.
Most missed payments are people who did not know a deadline existed, so this line does most of the
work in the whole design.

### 6. Dead settings

- **Delete from `.env.example`:** `BOOKING_ADVANCE_NOTICE_DAYS`, `BOOKING_BUFFER_MINUTES`,
  `BOOKING_CONFIRMATION_HOURS`. All three are read by no code; the live values are the
  `advanceNoticeDays` / `bufferMinutes` fields on `AvailabilityRules`. Keep `BOOKING_TIMEZONE`
  (genuinely read by `src/lib/booking-email.ts`).
- **Remove `confirmationWindowHours`** from `AvailabilityRules`. It promises auto-expiry that will
  never exist under the manual model chosen here. Leaving it would keep advertising behaviour the
  system does not have.
- **Keep the `expired` status** on `Bookings`, but reword its description to make clear the **admin
  sets it by hand** when abandoning a booking. It is a legitimate manual terminal state; it was only
  misleading as an implied automatic one.

## Testing

Integration (`tests/int/`, Resend and any model calls mocked, fixtures `Date.now()`-suffixed so they
re-run against a dirty DB):

1. `POST /api/bookings` **rejects with 400** a paid-package booking inside the 7-day window.
2. `POST /api/bookings` **accepts** a paid-package booking outside it.
3. The per-package override is honoured: the consultation (override `2`) accepts a booking 2 days
   out that a paid package would reject.
4. `paymentMode` and `depositAmount` are derived correctly for each `durationType` — in particular
   `call` → `pay_after_completion` with no deposit, and `week` → `deposit_final` at 50%.
5. `paymentDueAt` equals `startAt` − 3 days for paid packages, and is null for consultations.
6. The payment-instructions email contains both the deposit amount and the formatted deadline date.
7. A booking on a day with no matching availability rule is rejected.

The slots endpoint's existing behaviour must not change: its current responses stay identical after
the refactor onto the shared helper.

## Risks

- `src/payload-types.ts` regenerates on every schema change. It is generated — never hand-edit; run
  `pnpm generate:types`.
- Payload runs in push mode (no `src/migrations/`); schema changes apply on boot.
- Docker-first: do not run `pnpm build` or delete `.next` while the `resume-builder-app` container is
  running.
- `depositPercent` being configurable is a deliberate call over hardcoding 50 — payment terms are
  likely to be tuned, and it is one field in a global that already exists.
- Existing bookings created before this change have no `paymentDueAt`. They are not backfilled; the
  field is simply empty for them, and the admin handles those by hand as today.

## Order of work

1. Extract `src/lib/booking-availability.ts`; refactor the slots endpoint onto it (no behaviour
   change, existing tests stay green).
2. Add `Packages.advanceNoticeDays`; enforce the window in `POST /api/bookings`.
3. Correct the `paymentMode` / `depositAmount` derivation.
4. Add `depositPercent` + `depositDueDaysBeforeStart` to `bookingSettings`; add and compute
   `Bookings.paymentDueAt`; add it to `defaultColumns`.
5. Render the deposit amount and deadline in the payment-instructions email.
6. Remove the dead env vars and `confirmationWindowHours`; reword the `expired` status description.
7. Full verification: `pnpm generate:types`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test:int`.
