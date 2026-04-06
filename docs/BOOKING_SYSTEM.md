# Custom Booking System Guide

## Overview

A custom freelance booking platform integrated into your portfolio with Stripe payments, availability management, and a **pay-after-completion** workflow. Designed for a full-time employee doing freelance work on the side with 1-week advance booking notice.

## Table of Contents

1. [Payment Model](#payment-model)
2. [Booking Lifecycle](#booking-lifecycle)
3. [Stripe Setup Tasks](#stripe-setup-tasks)
4. [Environment Variables](#environment-variables)
5. [Availability Configuration](#availability-configuration)
6. [Implementation Checklist](#implementation-checklist)
7. [Testing Checklist](#testing-checklist)
8. [Security Checklist](#security-checklist)
9. [Maintenance](#maintenance)

---

## Payment Model

### Can I complete work before accepting payment? **Yes.**

Stripe supports multiple payment workflows. Here is the recommended approach for your situation:

### Recommended: **Manual Payout Mode**

```
Client books -> Client pays -> Money held in Stripe balance -> You complete work -> You transfer to bank
```

**How it works:**
1. Client pays via Stripe Checkout (money goes to your Stripe account balance)
2. **Disable automatic payouts** in Stripe Dashboard
3. You complete the work
4. You manually initiate payout to your bank account
5. If work is not completed or disputed, you can issue a full refund from your Stripe balance

**Why this is best practice:**
- Simple to implement (standard Stripe Checkout, no custom Payment Intents)
- Money is secured - client has paid, you have the funds in Stripe
- Full refund capability if work is not delivered
- No authorization expiry issues (unlike manual capture which expires in 7 days)
- Professional - client sees a real charge on their card

### Alternative Models (For Reference)

| Model | How It Works | Pros | Cons |
|-------|-------------|------|------|
| **Manual Payout** (recommended) | Client pays, Stripe holds, you payout after work | Simple, no expiry | Client charged immediately |
| **Manual Capture** | Authorize card, capture after work | Client not charged until capture | Auth expires in 7 days (max 31) |
| **Deposit + Final** | Charge deposit upfront, invoice remainder | Shared risk | More complex |
| **Invoicing** | Send Stripe Invoice after work | Client pays only after seeing work | Risk of non-payment |

### Payment Flow by Package Type

| Package | Payment Model | Reasoning |
|---------|--------------|-----------|
| 30-min Consultation | Pay upfront | Small amount, standard practice |
| Day Rate | Manual payout | Complete work same day, payout next day |
| Week Rate | Manual payout | Complete work, payout after delivery |
| Month Rate | Deposit (50%) + Final invoice | Large amount, milestone-based |

---

## Booking Lifecycle

### Status Flow

```
Client submits booking request
        |
[pending_review] -- You have 24 hours to accept/decline
        |
[accepted] -- Client receives payment link
        |
[pending_payment] -- Client has 24 hours to pay
        |
[paid] -- Payment confirmed via Stripe webhook
        |
[in_progress] -- You start working
        |
[work_completed] -- You mark work as done
        |
[payment_released] -- You payout from Stripe to your bank
        |
   DONE
```

### Cancellation and Refund Scenarios

| Scenario | Action |
|----------|--------|
| You decline booking | Status -> `cancelled`, no charge |
| Client cancels before payment | Status -> `cancelled`, no charge |
| Client cancels after payment, before work starts | Full refund from Stripe balance |
| Client cancels during work | Partial refund (negotiated) |
| You cannot complete work | Full refund from Stripe balance |
| Dispute | Handle via Stripe dispute resolution |

---

## Stripe Setup Tasks

### Step 1: Create Stripe Account

- [ ] Go to [stripe.com](https://stripe.com) and sign up
- [ ] Choose your country (Philippines)
- [ ] Select "Individual" or "Sole Proprietor"
- [ ] Complete identity verification:
  - [ ] Government ID (passport or national ID)
  - [ ] Proof of address
  - [ ] Tax information (TIN)
- [ ] Add bank account for payouts:
  - [ ] Bank name, account number, routing number
  - [ ] Verify with micro-deposits (takes 1-2 business days)

### Step 2: Configure Stripe Dashboard

- [ ] **Disable automatic payouts:**
  - Go to Settings -> Payouts -> Payout schedule
  - Set to "Manual" (you control when money goes to your bank)
- [ ] **Set up branding:**
  - Go to Settings -> Branding
  - Upload logo
  - Set brand colors to match your portfolio
  - Set statement descriptor (what appears on client bank statement)
    - Example: `ALLANAI.DEV`
- [ ] **Configure payment methods:**
  - Go to Settings -> Payment methods
  - Enable: Credit/debit cards (Visa, Mastercard)
  - Optional: Enable GCash/Maya if available in your Stripe region
- [ ] **Set up receipts:**
  - Go to Settings -> Emails
  - Enable automatic receipts
  - Customize receipt template

### Step 3: Get API Keys

- [ ] Go to Developers -> API keys
- [ ] Copy **Publishable key** (`pk_test_...` for test, `pk_live_...` for production)
- [ ] Copy **Secret key** (`sk_test_...` for test, `sk_live_...` for production)
- [ ] **Never commit secret keys to git**

### Step 4: Set Up Webhook

- [ ] Go to Developers -> Webhooks -> Add endpoint
- [ ] Set endpoint URL:
  - Local: `https://your-ngrok-url/api/webhooks/stripe`
  - Production: `https://allanai.dev/api/webhooks/stripe`
- [ ] Select events to listen for:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`
- [ ] Copy **Webhook signing secret** (`whsec_...`)

### Step 5: Install Stripe CLI (Local Development)

- [ ] Install Stripe CLI:
  ```bash
  # macOS
  brew install stripe/stripe-cli/stripe

  # Linux
  curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
  echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
  sudo apt update && sudo apt install stripe
  ```
- [ ] Login to Stripe CLI:
  ```bash
  stripe login
  ```
- [ ] Forward webhooks to local server:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
- [ ] Copy the webhook signing secret from CLI output

### Step 6: Create Test Products (Optional)

- [ ] Create test products in Stripe Dashboard:
  - Go to Products -> Add product
  - Create products matching your packages
  - Copy Product ID and Price ID to Payload admin
- [ ] Test with Stripe test cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`

### Step 7: Go Live

- [ ] Complete Stripe account verification
- [ ] Switch API keys from `test` to `live` in environment variables
- [ ] Update webhook endpoint to production URL
- [ ] Test with a real small payment ($1)
- [ ] Verify payout works to your bank account

---

## Environment Variables

### Local Development (.env.local)

```bash
# Stripe Configuration (Test Keys)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Booking Configuration
NEXT_PUBLIC_BOOKING_ENABLED=true
BOOKING_TIMEZONE=Asia/Manila
BOOKING_BUFFER_MINUTES=15
BOOKING_CONFIRMATION_HOURS=24
BOOKING_ADVANCE_NOTICE_DAYS=7
BOOKING_PAYOUT_MODE=manual
```

### Production (Vercel Environment Variables)

```bash
# Stripe Configuration (Live Keys)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Same booking configuration
NEXT_PUBLIC_BOOKING_ENABLED=true
BOOKING_TIMEZONE=Asia/Manila
BOOKING_BUFFER_MINUTES=15
BOOKING_CONFIRMATION_HOURS=24
BOOKING_ADVANCE_NOTICE_DAYS=7
BOOKING_PAYOUT_MODE=manual
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Server-side Stripe key (never expose) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | `whsec_...` |
| `NEXT_PUBLIC_BOOKING_ENABLED` | Toggle booking system on/off | `true` |
| `BOOKING_TIMEZONE` | Your working timezone | `Asia/Manila` |
| `BOOKING_BUFFER_MINUTES` | Buffer between bookings | `15` |
| `BOOKING_CONFIRMATION_HOURS` | Hours to accept/decline a booking | `24` |
| `BOOKING_ADVANCE_NOTICE_DAYS` | Minimum days in advance to book | `7` |
| `BOOKING_PAYOUT_MODE` | `manual` or `automatic` | `manual` |

---

## Availability Configuration

### Your Schedule (Full-Time Employee + Freelance)

Since you have a full-time job, configure availability for **evenings and weekends only**:

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

Advance Notice: 7 days (clients must book 1 week ahead)
Max Advance: 60 days
Confirmation Window: 24 hours
```

### Blocked Dates

Use the `blockedDates` field in Payload admin to block:
- Public holidays
- Vacation days
- Personal events
- Busy periods at full-time job

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Set up Stripe account (Steps 1-3 above)
- [ ] Add environment variables to `.env.local`
- [ ] Install `stripe` npm package:
  ```bash
  npm install stripe
  ```
- [ ] Create `src/lib/stripe.ts` utility
- [ ] Seed sample packages in Payload admin:
  - 30-min Consultation ($50)
  - Day Rate ($400)
  - Week Rate ($1,800)
  - Month Rate ($6,000)
- [ ] Configure availability rules in Payload admin

### Phase 2: Pricing Page (Week 1)

- [ ] Finalize PricingPage component styling
- [ ] Add package details and deliverables
- [ ] Add availability status indicators
- [ ] Test responsive design on mobile

### Phase 3: Booking Flow (Week 2)

- [ ] Create `/book/[packageId]` page
- [ ] Build time slot picker component
- [ ] Build customer information form
- [ ] Implement booking request submission API (`/api/bookings`)
- [ ] Add booking confirmation email (via Resend)

### Phase 4: Payment Integration (Week 2)

- [ ] Create Stripe Checkout session endpoint (`/api/bookings/checkout`)
- [ ] Create webhook handler (`/api/webhooks/stripe`)
- [ ] Implement payment confirmation flow
- [ ] Build success/cancel pages (`/book/success`, `/book/cancel`)
- [ ] Test with Stripe test cards

### Phase 5: Admin Management (Week 3)

- [ ] Build admin booking dashboard (or use Payload admin)
- [ ] Add accept/decline booking actions
- [ ] Add payout tracking
- [ ] Add email notifications for status changes

### Phase 6: Polish and Launch (Week 3-4)

- [ ] Update Header navigation (add Pricing link)
- [ ] Update CTAButtons across all pages
- [ ] SEO metadata for pricing page
- [ ] Test complete flow end-to-end
- [ ] Switch to Stripe live keys
- [ ] Deploy to production

---

## Testing Checklist

### Stripe Testing

- [ ] Test successful payment with `4242 4242 4242 4242`
- [ ] Test declined card with `4000 0000 0000 0002`
- [ ] Test 3D Secure with `4000 0025 0000 3155`
- [ ] Test webhook delivery (check Stripe Dashboard -> Webhooks -> Logs)
- [ ] Test refund flow
- [ ] Test manual payout from Stripe Dashboard

### Booking Flow Testing

- [ ] Submit booking request as client
- [ ] Verify 24-hour confirmation window
- [ ] Accept booking as admin
- [ ] Complete payment as client
- [ ] Mark work as completed
- [ ] Initiate payout

### Edge Cases

- [ ] Double booking prevention
- [ ] Expired booking cleanup
- [ ] Payment failure handling
- [ ] Timezone conversion accuracy
- [ ] Mobile responsiveness

---

## Security Checklist

- [ ] Stripe webhook signature validation
- [ ] Rate limiting on booking endpoints (3/hour/IP)
- [ ] Input validation with Zod schemas
- [ ] HTTPS enforcement
- [ ] No secret keys in client-side code
- [ ] CSRF protection
- [ ] SQL injection prevention (handled by Payload)
- [ ] XSS prevention (handled by React)

---

## Maintenance

### Weekly Tasks

- [ ] Check Stripe Dashboard for pending payouts
- [ ] Review and respond to booking requests within 24 hours
- [ ] Update blocked dates if schedule changes

### Monthly Tasks

- [ ] Review booking analytics
- [ ] Check for failed webhooks in Stripe Dashboard
- [ ] Update package pricing if needed
- [ ] Review and optimize conversion rates

### Quarterly Tasks

- [ ] Review Stripe fees and pricing structure
- [ ] Update availability rules for seasonal changes
- [ ] Consider new package offerings based on demand

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not receiving events | Check endpoint URL, verify Stripe CLI is running (local dev) |
| Payment not confirming | Check webhook logs in Stripe Dashboard |
| Timezone mismatch | Ensure `BOOKING_TIMEZONE` matches Payload admin setting |
| Booking slots not showing | Check availability rules are active and dates are not blocked |
| Payout failing | Verify bank account details in Stripe Dashboard |

### Support Resources

- [Stripe Documentation](https://docs.stripe.com)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

**Last Updated**: 2026-04-06
**Version**: 1.0
**Next Review**: 2026-07-06