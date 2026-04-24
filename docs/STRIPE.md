# Stripe Integration Guide

Complete guide for setting up, managing, and testing Stripe API keys for the booking system.

## Table of Contents

- [Overview](#overview)
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
