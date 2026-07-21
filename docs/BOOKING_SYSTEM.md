# Custom Booking System Guide

## Overview

A custom freelance booking platform integrated into the portfolio, with availability management and
a **flat 50% deposit, out-of-band payment** workflow. Designed for a full-time employee doing
freelance work on the side with a 7-day default advance booking notice (2 days for the free
consultation), enforced server-side.

There is no payment processor integration. Payment is settled by the client directly — bank
transfer, GCash, or invoice — using instructions the admin writes once in Payload admin. The admin
confirms receipt by hand after checking their own bank/GCash; the app never auto-marks a booking
paid.

## Table of Contents

1. [Payment Model](#payment-model)
2. [Booking Lifecycle](#booking-lifecycle)
3. [Booking Settings (Global)](#booking-settings-global)
4. [Payment-Proof Upload](#payment-proof-upload)
5. [Environment Variables](#environment-variables)
6. [Availability Configuration](#availability-configuration)
7. [Email Notifications](#email-notifications)
8. [Testing Checklist](#testing-checklist)
9. [Security Checklist](#security-checklist)
10. [Maintenance](#maintenance)

---

## Payment Model

### How payment works

```
Client submits request -> Admin accepts -> Admin moves status to "Pending Payment"
  -> Client receives payment instructions by email (bank / GCash / invoice)
  -> Client pays out of band, optionally uploads a receipt screenshot for convenience
  -> Admin checks their own bank/GCash and manually marks the booking "Paid"
  -> Work proceeds
```

**Why out-of-band:**
- No payment processor account, fees, or PCI/webhook surface to maintain
- The admin is the sole source of truth for "did the money arrive" — a screenshot is a claim, not
  proof
- Fits a low-volume freelance side-practice better than a full checkout integration

### Payment Flow by Package Type

`POST /api/bookings` derives `paymentMode` from the package's `durationType`:

| `durationType` | `paymentMode` | Deposit |
|---|---|---|
| `call` (consultation) | `pay_after_completion` | None — no payment to book |
| `day` / `week` / `month` | `deposit_final` | Flat `depositPercent` (default 50%) of `pkg.price`, computed as `Math.round(price * depositPercent / 100)` |

The consultation is the sales conversation, so it takes no payment to book. Every paid package takes
the same flat deposit; the remaining balance is invoiced manually after the work — the system tracks
exactly one payment event per booking.

Consultations never enter `pending_payment` — they run
`pending_review → accepted → in_progress → work_completed` directly.

---

## Booking Lifecycle

### Status Flow

```
Client submits booking request
        |
[pending_review] -- Admin has a window to accept/decline
        |
[accepted] -- Admin moves to Pending Payment when ready to invoice
        |
[pending_payment] -- Client is emailed payment instructions (bank/GCash/invoice)
        |
[payment_submitted] -- (optional) client uploaded a receipt screenshot; admin is emailed to verify
        |
[paid] -- Admin has manually confirmed the money arrived; client is emailed a confirmation
        |
[in_progress] -- Admin starts working
        |
[work_completed] -- Admin marks work as done
        |
   DONE
```

`payment_submitted` is optional — the admin can move a booking straight from `pending_payment` to
`paid` once they see the transfer land, with or without the client uploading a receipt.

### Lead Time and Payment Deadline

Two clocks govern a booking, both enforced server-side in `POST /api/bookings` via the shared
`src/lib/booking-availability.ts` helpers (also used by `GET /api/availability/slots`, so the two
endpoints cannot drift):

- **Lead time** — the minimum notice a client must give before a session start. Resolved as
  `pkg.advanceNoticeDays ?? rule.advanceNoticeDays ?? 7`. The consultation package overrides this to
  `2` days; paid packages leave it empty and inherit the availability rule's `7`. A request outside
  the window is rejected with **400** before anything is created (not just hidden from the calendar).
- **Payment deadline** (`Bookings.paymentDueAt`) — computed at creation as `startAt` minus
  `bookingSettings.depositDueDaysBeforeStart` (default 3 days), stored on the booking so the admin
  list can sort/filter by it. Null for consultations, which never take a deposit. This is the admin's
  guaranteed window to verify the deposit landed before the session starts — nothing expires it
  automatically; the admin acts on it by hand.

The governing constraint is lead time ≥ client payment window + admin verification buffer — at the
defaults, 7 days splits into ~4 days for the client to pay and 3 for the admin to verify.

### Side States

All side states are set **by hand** — there is no cron and no auto-expiry anywhere in the project.
The admin spots bookings that need attention (e.g. an unpaid deposit past its deadline) by sorting
the admin list by `paymentDueAt`, then sets the appropriate state manually.

| State | Meaning |
|-------|---------|
| `cancelled` | Declined by admin, or cancelled by either party before payment |
| `expired` | Admin manually abandons a booking (e.g. the client never paid the deposit and went quiet) — never set automatically |
| `refunded` | Money was returned to the client out of band |
| `disputed` | Client disputes the charge/work; handled manually |

---

## Booking Settings (Global)

Configured in **Payload admin → Globals → Booking Settings** (`src/BookingSettings/config.ts`,
slug `bookingSettings`):

| Field | Type | Purpose |
|-------|------|---------|
| `bookingEnabled` | checkbox | Kill switch. When off, the booking form stops accepting new submissions. Defaults to `true`. |
| `paymentTermsSummary` | text | One-line summary shown on the booking form before the client submits, e.g. "Payment is by invoice after I review and accept your request." |
| `paymentInstructions` | textarea | Bank / GCash details and invoice terms. Emailed to the client verbatim (line breaks preserved) when a booking moves to `pending_payment`. |
| `notificationEmail` | email | Where new-booking, proof-submitted, and payment alerts go. Falls back to the `BOOKING_NOTIFICATION_EMAIL` env var if unset. |
| `depositPercent` | number | Percentage of package price required as a deposit to secure a paid booking. Default `50`. |
| `depositDueDaysBeforeStart` | number | Days before `startAt` the deposit must clear; the admin's verification buffer. Default `3`. Computes `Bookings.paymentDueAt` at creation. |

All six are read server-side in `src/collections/Bookings/hooks/sendStatusEmails.ts` at the moment
of a status transition — there's no caching to worry about when the admin edits them.

---

## Payment-Proof Upload

Clients can (optionally) upload a screenshot of their payment at `/book/proof/[bookingId]`, which
posts to `POST /api/bookings/proof`.

- Rate-limited (5 uploads/hour/IP) and both size- and stream-bounded (10 MB cap enforced on the
  request stream itself, not just the reported `Content-Length`, to close a DoS gap).
- The image is sent to **Claude vision** (`src/lib/receipt-ocr.ts`, `@anthropic-ai/sdk`) to extract
  amount, currency, reference number, sender name, timestamp, and channel (GCash/bank/etc.) — purely
  as a convenience so the admin doesn't have to squint at the screenshot themselves.
- **The extraction is never trusted.** It's a claim derived from an image the client controls. The
  booking's status moves to `payment_submitted` (which emails the admin to go check their own
  bank/GCash), but the app never auto-transitions a booking to `paid`. Only the admin, acting on
  their own verification, does that.
- The OCR call is designed to never throw: a garbled or unreadable image, or an API failure,
  produces an empty/null extraction rather than blocking the upload.

---

## Environment Variables

### Booking configuration (`.env.example`)

```bash
# Booking Notifications (Resend — reuses RESEND_API_KEY)
BOOKING_NOTIFICATION_EMAIL=your-email@gmail.com

# Booking Configuration
BOOKING_TIMEZONE=Asia/Manila

# Claude vision — payment-receipt OCR (src/lib/receipt-ocr.ts)
ANTHROPIC_API_KEY=sk-ant-...
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `BOOKING_NOTIFICATION_EMAIL` | Fallback admin address for booking alerts if `bookingSettings.notificationEmail` is unset | `you@gmail.com` |
| `BOOKING_TIMEZONE` | Working timezone for availability calculations | `Asia/Manila` |
| `ANTHROPIC_API_KEY` | Powers receipt OCR on the proof-upload endpoint | `sk-ant-...` |

`bookingEnabled` (the on/off switch for the booking form), payment terms/instructions, and the
deposit/deadline settings (`depositPercent`, `depositDueDaysBeforeStart`) live in the
`bookingSettings` global, not in env vars — see [Booking Settings](#booking-settings-global) above.
Buffer minutes and advance-notice days live on the `AvailabilityRules` collection (with an optional
per-package `advanceNoticeDays` override on `Packages`) — there used to be `BOOKING_BUFFER_MINUTES`,
`BOOKING_CONFIRMATION_HOURS`, and `BOOKING_ADVANCE_NOTICE_DAYS` env vars, but they were never read by
any code and have been removed; `AvailabilityRules.confirmationWindowHours` (which implied an
auto-expiry that never existed) has likewise been removed from the schema.

---

## Availability Configuration

### Schedule (Full-Time Employee + Freelance)

Since availability is typically evenings and weekends only:

```
Example availability rules (configured in Payload admin):

Rule 1: Weekday Evenings
  Days: Mon-Fri
  Hours: 18:00 - 22:00 (6 PM - 10 PM)
  Timezone: Asia/Manila

Rule 2: Weekend Full Day
  Days: Sat-Sun
  Hours: 09:00 - 18:00 (9 AM - 6 PM)
  Timezone: Asia/Manila

Advance Notice: 7 days (clients must book 1 week ahead), enforced server-side in POST /api/bookings
  — overridable per package (Packages.advanceNoticeDays); the consultation package overrides it to 2 days
Max Advance: 60 days
```

### Blocked Dates

Use the `blockedDates` field in Payload admin to block:
- Public holidays
- Vacation days
- Personal events
- Busy periods at the full-time job

---

## Email Notifications

Implemented via `src/lib/booking-email.ts` using Resend, and dispatched from
`src/collections/Bookings/hooks/sendStatusEmails.ts` on status transitions.

### Triggers

| Event | Customer Email | Admin Email | Notification address |
|-------|---------------|-------------|-----------------------|
| Booking submitted | "We received your request" | New booking alert | `bookingSettings.notificationEmail` (fallback `BOOKING_NOTIFICATION_EMAIL` / `CONTACT_FORM_TO_EMAIL`) |
| Status → `pending_payment` | Payment instructions (bank/GCash/invoice) | — | — |
| Status → `payment_submitted` | — | "Client uploaded a receipt — go verify it" | `bookingSettings.notificationEmail` |
| Status → `paid` | Payment confirmation + next steps | — | — |

All are fire-and-forget — a mail failure is logged but never throws or blocks the status change /
API response. Emails silently no-op if `RESEND_API_KEY` is not set.

### Functions

```ts
// src/lib/booking-email.ts
sendBookingRequestEmails(customer, booking): Promise<void>
sendPaymentInstructionsEmail(customer, booking, opts): Promise<void>
sendProofSubmittedAdminEmail(customer, booking, opts): Promise<void>
sendPaymentConfirmedEmails(customer, booking): Promise<void>
```

### Remaining (Planned)

- Booking accepted/declined notification to customer
- 24-hour reminder before session
- 1-hour reminder before session
- Post-booking follow-up

---

## Testing Checklist

### Booking Flow Testing

- [ ] Submit booking request as client
- [ ] Verify a request inside the lead-time window is rejected (400) by `POST /api/bookings`
- [ ] Verify the per-package `advanceNoticeDays` override is honoured (consultation books closer in)
- [ ] Accept booking as admin
- [ ] Move to Pending Payment, confirm client receives instructions email with the deposit amount
      and `paymentDueAt` deadline
- [ ] Upload a receipt screenshot at `/book/proof/[bookingId]`, confirm admin receives the alert
      email with the extracted fields
- [ ] Mark Paid as admin, confirm client receives confirmation email
- [ ] Mark work as completed

### Edge Cases

- [ ] Double booking prevention
- [ ] Admin manually sets `expired` on an abandoned unpaid booking (there is no auto-expiry)
- [ ] Proof upload: oversized file rejected, rate limit enforced, non-image rejected
- [ ] Proof upload: unreadable/garbled image degrades to an empty extraction rather than erroring
- [ ] Re-saving a booking without a status change does not re-send any email
- [ ] Timezone conversion accuracy
- [ ] Mobile responsiveness

---

## Security Checklist

- [ ] Rate limiting on booking + proof-upload endpoints
- [ ] Proof-upload request size and stream bounded (not just `Content-Length` trusted)
- [ ] Input validation with Zod schemas
- [ ] HTTPS enforcement
- [ ] No secret keys in client-side code
- [ ] CSRF protection
- [ ] SQL injection prevention (handled by Payload)
- [ ] XSS prevention (handled by React)
- [ ] Receipt OCR extraction never trusted as proof of payment — admin verification is mandatory

---

## Maintenance

### Weekly Tasks

- [ ] Review and respond to new booking requests promptly
- [ ] Sort the admin Bookings list by `paymentDueAt` to spot overdue deposits; follow up or set
      `expired` by hand — nothing does this automatically
- [ ] Check for bookings sitting in `payment_submitted` awaiting manual verification
- [ ] Update blocked dates if schedule changes

### Monthly Tasks

- [ ] Review booking analytics
- [ ] Update package pricing if needed
- [ ] Review and optimize conversion rates

### Quarterly Tasks

- [ ] Update availability rules for seasonal changes
- [ ] Consider new package offerings based on demand

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Client didn't receive payment instructions | Check `RESEND_API_KEY` is set and `bookingSettings.paymentInstructions` is non-empty; check Resend logs |
| Admin didn't receive proof-submitted alert | Check `bookingSettings.notificationEmail` / `BOOKING_NOTIFICATION_EMAIL` is set |
| Receipt OCR returns all-null fields | Expected for unreadable/garbled images — the extraction is best-effort, verify against your bank manually |
| Timezone mismatch | Ensure `BOOKING_TIMEZONE` matches the Payload admin setting |
| Booking slots not showing | Check availability rules are active and dates are not blocked |
| Proof upload rejected | Check file size (10 MB cap) and that the rate limit (5/hour/IP) hasn't been hit |

---

**Last Updated**: 2026-07-21
**Version**: 2.1
**Next Review**: 2026-10-21
