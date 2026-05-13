# Stripe Integration Guide

Complete guide for setting up, managing, and testing Stripe API keys for the booking system.

## Table of Contents

- [Overview](#overview)
- [**Setup Runbook (Test → Live)**](#setup-runbook-test--live) ← start here
- [Account Setup](#account-setup)
- [Creating a New Test API Key](#creating-a-new-test-api-key)
- [Restricted Keys (Best Practice)](#restricted-keys-best-practice)
- [Webhook Setup for Local Testing](#webhook-setup-for-local-testing)
- [Environment Variables](#environment-variables)
- [Test Cards](#test-cards)
- [Switching to Live Keys](#switching-to-live-keys)
- [Rotating / Revoking Keys](#rotating--revoking-keys)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses Stripe for booking payments. The integration covers:

- **Stripe Checkout** — hosted payment page for booking payments
- **Webhooks** — server-to-server confirmation that a payment succeeded
- **Refunds** — admin-initiated from the Stripe dashboard
- **Coupons / Promotion Codes** — discount codes applied at checkout (Phase 4C.12)

---

## Setup Runbook (Test → Live)

If you have never set up Stripe before, follow this runbook end-to-end. **Never skip Phase 2 or 3** — going straight to Live with an untested integration is how freelancers lose money on failed webhooks, mismatched amounts, and broken refund flows.

> **Time estimate:** Phase 1 ≈ 30 min; Phase 2 ≈ 30 min; Phase 3 (waiting on Stripe verification) hours-to-days; Phase 4 ≈ 15 min.

### Phase 1 — Test mode setup (your first run)

Goal: a working booking flow that takes a fake card payment, fires a webhook, marks the booking paid in Payload, and sends the confirmation emails.

- [ ] **Create Stripe account** → see [Account Setup](#account-setup). Country = Philippines, Individual / Sole Proprietor.
- [ ] **Set payouts to manual.** Settings → Payouts → Manual. Don't skip this — it's your safety net.
- [ ] **Get test API keys.** Dashboard top-left toggle → **TEST**. Then [Creating a New Test API Key](#creating-a-new-test-api-key). Copy `pk_test_...` and `sk_test_...`.
- [ ] **Add test keys to `.env`** (local dev — see [Environment Variables](#environment-variables)):
  ```
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=          # filled in next step
  ```
- [ ] **Install and run Stripe CLI** for webhook forwarding → see [Webhook Setup for Local Testing](#webhook-setup-for-local-testing). Run in a separate terminal:
  ```
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
  The CLI prints `whsec_...` — paste that into `STRIPE_WEBHOOK_SECRET` in `.env`.
- [ ] **Restart the Docker dev container** so it picks up the new env vars:
  ```
  docker restart resume-builder-app
  ```
- [ ] **Seed the booking system data** (only if you don't have packages yet):
  ```
  pnpm seed:resume      # or use the admin → "Seed bookings" button
  ```
- [ ] **First fake-payment dry run.** With dev server up + Stripe CLI listening:
  1. Visit `http://localhost:3000/services` → click any package → fill the booking form
  2. After admin acceptance (Payload admin → Bookings → set status to `accepted`), the customer gets the payment link
  3. On the checkout page, use card `4242 4242 4242 4242` (any future expiry, any 3-digit CVC)
  4. Watch the Stripe CLI terminal — you should see `checkout.session.completed` event being forwarded
  5. Open Payload admin → Bookings → confirm status flipped to `paid`
  6. Check the configured `BOOKING_NOTIFICATION_EMAIL` and customer email for confirmation messages

If all of that works on the first try, congratulations — you have a fully wired test-mode booking system. If not, see [Troubleshooting](#troubleshooting). 90% of issues are missing/wrong env vars or the Stripe CLI not running.

### Phase 2 — Test scenarios you MUST run before going Live

Don't skip any of these. Each one corresponds to a real failure mode that will hit you eventually with real money.

- [ ] **Successful payment** — `4242 4242 4242 4242`. Booking → `paid`. Emails fire. ✅
- [ ] **Generic card decline** — `4000 0000 0000 0002`. User sees decline message. Booking stays in `pending_payment`. No email sent. No webhook side-effects. ✅
- [ ] **3D Secure / SCA flow** — `4000 0025 0000 3155`. Browser prompts for authentication; on confirm, payment succeeds. ✅
- [ ] **3D Secure failure** — `4000 0000 0000 3055`. Auth fails; user can retry. ✅
- [ ] **Insufficient funds** — `4000 0000 0000 9995`. Same as decline; user gets a clear message. ✅
- [ ] **Webhook resilience** — kill the Stripe CLI, complete a successful payment with `4242`, restart the CLI. Stripe should retry the webhook delivery (visible in the CLI). Booking eventually flips to `paid`. ✅
- [ ] **Refund flow** — In Stripe dashboard → Payments → click your test payment → **Refund**. Confirm the booking transitions correctly (Payload admin should reflect the refund — check whatever your refund handling logic does).
- [ ] **Dispute / chargeback** — `4000 0000 0000 2685` triggers an automatic dispute after a few minutes. Make sure your admin sees it (Stripe dashboard → Disputes).
- [ ] **Email receipts** — verify the customer email and your admin notification email both arrived (sent via Resend, see `BOOKING_NOTIFICATION_EMAIL`).
- [ ] **Coupon / promo code** (if enabled) — apply a test promo code at checkout, verify the discount is reflected in the final amount and stored on the booking record.

If any of these fail, fix before continuing. **Do not flip to Live until all checkboxes are green.**

### Phase 3 — Stripe account verification (required for Live)

Stripe won't let you accept real payments until your account is fully verified. This is gated by Stripe's review and can take hours-to-days.

- [ ] **Submit business details.** Dashboard → Settings → Account details → fill out everything (legal name, address, phone, tax ID if you have one).
- [ ] **Verify identity.** Upload a government ID (Stripe will tell you which docs are accepted for PH).
- [ ] **Add and verify your bank account.** Settings → Payouts → Add bank account. Stripe sends a tiny verification deposit; confirm the amount in their dashboard.
- [ ] **(Recommended) Use Wise as your payout destination** — see the booking-system suggestion in your previous chat. Wise gives you a USD account that connects to Stripe; you then convert USD → PHP at mid-market rate. Saves 2–3% vs your local bank's FX markup on every payout.
- [ ] **Wait for the dashboard to say "Account verified"** — appears as a green badge next to your account name.
- [ ] **Set the live payout schedule to manual** — same reason as Phase 1: keep money in your Stripe balance until you've delivered the work.

### Phase 4 — Go Live

- [ ] **Switch dashboard to LIVE mode** (toggle top-left, must show "LIVE" not "TEST").
- [ ] **Get live API keys.** Developers → API keys → copy `pk_live_...` and create a new `sk_live_...`. See [Switching to Live Keys](#switching-to-live-keys).
- [ ] **Configure the production webhook endpoint** in Stripe Dashboard:
  - URL: `https://www.allanai.dev/api/webhooks/stripe` (or whichever production URL applies)
  - Events to send: at minimum `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`
  - Copy the new live `whsec_...` signing secret
- [ ] **Update Vercel environment variables** for Production environment:
  ```
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...   # the LIVE webhook secret, NOT the CLI one
  ```
  → Vercel project → Settings → Environment Variables → update each → save → **Redeploy**.
- [ ] **First real-money smoke test.** Use your own card to pay $1 (or the smallest package you offer):
  1. Run through the live booking flow on production
  2. Verify the payment shows in the live Stripe dashboard
  3. Verify Vercel function logs show `/api/webhooks/stripe` returning 200
  4. Verify Payload production admin marked the booking `paid`
  5. Verify both confirmation emails arrived
  6. **Refund yourself** from the dashboard — verify the refund flow handles correctly. (You eat the Stripe fee, ~$0.30 — cheapest insurance you'll ever buy.)
- [ ] **Done.** You're live.

### Pre-go-Live one-page checklist

Print or screenshot this. If you can't tick every box, don't flip the switch.

```
TEST MODE
[ ] All Phase 1 dry-run checkboxes green
[ ] Phase 2 — every test scenario verified
[ ] Webhook signing secret matches the running mode (CLI for local, dashboard for prod)

ACCOUNT
[ ] Stripe account fully verified (green badge)
[ ] Bank account verified
[ ] Payouts set to MANUAL (both test and live)

PRODUCTION CONFIG
[ ] Vercel env vars updated to pk_live_ / sk_live_ / live whsec_
[ ] Production webhook endpoint configured in Stripe dashboard
[ ] Production webhook events list includes the 5 critical events
[ ] Vercel deployment redeployed AFTER updating env vars

GO-LIVE TEST
[ ] $1 real payment from your own card succeeded end-to-end
[ ] Refund tested and worked
[ ] Production logs clean (no errors in webhook handler)
```

---

## Account Setup

If you haven't set up a Stripe account yet:

1. Go to [stripe.com](https://stripe.com) → **Sign Up** (free)
2. Choose your country (Philippines)
3. Select **Individual / Sole Proprietor**
4. Complete identity verification (government ID + bank account)
5. **Disable automatic payouts**: Settings → Payouts → Payout schedule → **Manual**
   - This is critical: money stays in your Stripe balance until you manually transfer it, giving you time to complete and verify work first

---

## Creating a New Test API Key

You may need a fresh test key for a new environment (staging, a second developer, etc.) or if you suspect a key has been compromised.

### Steps

1. **Log in to Stripe Dashboard**
   - Go to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you are in **Test mode** (toggle in the top-left — must show "TEST")

2. **Navigate to API Keys**
   - Click **Developers** in the top navigation
   - Click **API keys** in the left sidebar

3. **View existing keys**
   - You will see your **Publishable key** (visible, starts with `pk_test_...`)
   - And a partially hidden **Secret key** (starts with `sk_test_...`)

4. **Create a new secret key (if needed)**
   - Click **+ Create secret key** (or **+ Create restricted key** — see next section)
   - Give it a name, e.g. `Resume Builder - Dev`
   - Click **Create**
   - **Copy the key immediately** — Stripe shows the full value only once

5. **Copy the publishable key**
   - Click **Reveal test key** next to the publishable key, or just copy it as-is (it's not secret)

6. **Add to your `.env.local`**
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   ```

> **Security rule:** The secret key (`sk_test_...`) must NEVER appear in client-side code or be committed to git. Only the publishable key (`pk_test_...`) is safe for the browser.

---

## Restricted Keys (Best Practice)

Instead of giving your app full account access, create a **restricted key** that only has the permissions it needs. This limits blast radius if the key is ever leaked.

### Permissions needed for this project

| Permission | Access Level | Why |
|-----------|-------------|-----|
| Checkout Sessions | Write | Create checkout sessions |
| Payment Intents | Read | Verify payment status |
| Customers | Write | Create/update customer records |
| Coupons | Read | Validate coupon codes |
| Promotion Codes | Read | Validate promo codes |
| Webhooks | None (managed separately) | Webhook secret is separate |

### How to create a restricted key

1. Go to **Developers → API keys**
2. Click **+ Create restricted key**
3. Name it `Resume Builder - Restricted`
4. Set permissions as listed above (everything else set to **None**)
5. Click **Create key**
6. Copy and save it immediately

---

## Webhook Setup for Local Testing

Webhooks allow Stripe to notify your app when a payment is confirmed. Local testing requires the Stripe CLI to forward events to your localhost.

### One-time CLI setup

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux (Debian/Ubuntu)
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public \
  | gpg --dearmor \
  | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" \
  | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Authenticate (opens browser)
stripe login
```

### Forward webhooks to your local server

Run this in a separate terminal while developing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will output a webhook signing secret:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx (^C to quit)
```

Copy that and add it to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

> **Important:** This CLI-generated secret is different from the one in your Stripe dashboard webhook settings. Use the CLI secret for local dev, the dashboard secret for production.

### Trigger test events manually

```bash
# Simulate a successful payment
stripe trigger checkout.session.completed

# Simulate a refund
stripe trigger charge.refunded

# Simulate a dispute
stripe trigger charge.dispute.created

# List all available events
stripe trigger --help
```

### Production webhook (Vercel)

1. Go to **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://allanai.dev/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `charge.dispute.created`
4. Click **Add endpoint**
5. Click **Reveal** next to **Signing secret** — copy `whsec_...`
6. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Environment Variables

### Local development (`.env.local`)

```bash
# Test keys — safe to use with test cards only
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` CLI output
```

### Production (Vercel environment variables)

```bash
# Live keys — only after Stripe account is fully verified
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from Stripe dashboard webhook settings
```

### Variable reference

| Variable | Starts With | Safe for Browser? | Description |
|----------|------------|------------------|-------------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_` / `pk_live_` | ✅ Yes | Used in client-side Stripe.js |
| `STRIPE_SECRET_KEY` | `sk_test_` / `sk_live_` | ❌ No — server only | Used in API routes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` | ❌ No — server only | Validates webhook signatures |

---

## Test Cards

Use these card numbers in Stripe's test mode (any future expiry, any 3-digit CVC, any ZIP):

| Scenario | Card Number | Notes |
|----------|-------------|-------|
| Successful payment | `4242 4242 4242 4242` | Instant success |
| Card declined | `4000 0000 0000 0002` | Generic decline |
| Insufficient funds | `4000 0000 0000 9995` | Decline: insufficient funds |
| 3D Secure required | `4000 0025 0000 3155` | Prompts authentication step |
| 3D Secure + success | `4000 0000 0000 3220` | Auth succeeds |
| 3D Secure + fail | `4000 0000 0000 3055` | Auth fails |
| Dispute / chargeback | `4000 0000 0000 2685` | Automatically creates dispute |

Full list: [stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## Switching to Live Keys

Do this only when:
- Stripe account is fully verified (identity + bank account)
- You have tested the full booking flow with test cards
- The production webhook endpoint is configured

### Steps

1. **In Stripe Dashboard** — switch to **Live mode** (toggle top-left)
2. Go to **Developers → API keys**
3. Copy the **live publishable key** (`pk_live_...`)
4. Click **+ Create secret key** → copy the live secret key (`sk_live_...`)
5. Set up the production webhook (see above) → copy the live webhook secret
6. **In Vercel** — update all three environment variables with the live values
7. Redeploy: `git push` or click **Redeploy** in Vercel dashboard
8. Test with a real small payment ($1) to verify the full flow

---

## Rotating / Revoking Keys

If a key may have been exposed (e.g., accidentally committed to git):

1. Go to **Developers → API keys**
2. Click the **"..."** menu next to the compromised key
3. Click **Roll key** (generates a new one and immediately invalidates the old one)
4. Update the new key in `.env.local` and Vercel environment variables
5. Redeploy

> **If committed to git**: Also remove it from git history with `git filter-repo` or GitHub's secret scanning tool. Rolling the key in Stripe makes it invalid regardless, but clean up the repo too.

---

## Troubleshooting

### "No such customer" / "No such price"

Cause: Using a live resource ID with test keys (or vice versa).

Solution: Make sure `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are both from the same mode (both `test` or both `live`).

### Webhook events not arriving locally

Cause: Stripe CLI is not running or is pointed at the wrong port.

Solution:
```bash
# Confirm your dev server port, then run:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### "Webhook signature verification failed"

Cause: Wrong `STRIPE_WEBHOOK_SECRET` — mixing the CLI secret with the dashboard secret.

Solution:
- **Local**: Use the `whsec_...` from `stripe listen` CLI output
- **Production**: Use the `whsec_...` from Stripe Dashboard → Webhooks → your endpoint → Signing secret

### Payment succeeds but booking not marked paid

Cause: Webhook not delivered or handler throwing an error.

Solution:
1. Check Stripe Dashboard → **Developers → Webhooks → your endpoint → Recent deliveries**
2. Look for failed events — click one to see the response body / error
3. Check your server logs for errors in `/api/webhooks/stripe`

### Test card declined

Cause: Using a real card number in test mode, or using test card in live mode.

Solution: Use only the test cards listed above in test mode. Test cards are rejected in live mode.

---

## Quick Reference

```bash
# Start webhook forwarding (run in separate terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger a test payment event
stripe trigger checkout.session.completed

# Check your account balance
stripe balance

# List recent events
stripe events list --limit 10
```

---

**Last Updated**: 2026-04-18
**Version**: 1.0
