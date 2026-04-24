# Resend Email Integration Guide

Complete guide for setting up and using Resend email service with the contact form.

## Table of Contents

- [Overview](#overview)
- [Why Resend?](#why-resend)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Domain Configuration](#domain-configuration)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

---

## Overview

Resend is a modern email API designed for developers, providing reliable email delivery for transactional emails like contact form submissions. This project uses Resend to power the contact form at `/contact` and booking notification emails.

---

## How `contact@allanai.dev` Is Set Up

**Short answer: Cloudflare owns the DNS records, Resend does the actual sending.**

| Layer | Service | What It Does |
|-------|---------|-------------|
| Domain purchase | Cloudflare | Owns and manages `allanai.dev` |
| DNS records | Cloudflare | Hosts TXT, MX, and DKIM records that Resend requires |
| Email sending | Resend | Uses those DNS records to send authenticated email from `contact@allanai.dev` |

**DNS records Resend added to Cloudflare:**

```
Type: TXT  | Name: @                    | Value: resend-verification=xxx (domain ownership proof)
Type: MX   | Name: @                    | Value: feedback-smtp.resend.com (Priority: 10)
Type: TXT  | Name: resend._domainkey    | Value: v=DKIM1; k=rsa; p=... (email signature key)
```

Resend reads these records to prove to receiving mail servers (Gmail, Outlook, etc.) that emails from `contact@allanai.dev` are legitimate. Without them, emails would land in spam.

---

## How to Add Additional Email Recipients

This project supports multiple ways to route emails to extra recipients. Use the method that fits your need:

### Option 1 — Booking Notification Email (separate from contact form)

For booking-related alerts (new booking, payment received), set a dedicated admin email:

```bash
# .env.local or Vercel environment variables
BOOKING_NOTIFICATION_EMAIL=your-email@gmail.com
```

- Falls back to `CONTACT_FORM_TO_EMAIL` if not set
- Used by `src/lib/booking-email.ts` for both booking request and payment alerts
- **Best practice**: Use a separate address so booking emails don't mix with contact form emails

### Option 2 — CC Recipients on Contact Form Emails

To CC additional addresses on every contact form submission:

```bash
CONTACT_FORM_CC_EMAILS=backup@gmail.com,team@company.com
```

- Comma-separated, no spaces
- Optional — remove the variable entirely if not needed
- Handled automatically in `src/app/(frontend)/api/contact/route.ts`

### Option 3 — Multiple `To` Recipients (Code Change)

To send the same email to multiple primary recipients, edit the contact route or booking email utility directly:

```typescript
// src/app/(frontend)/api/contact/route.ts — change `to` to an array
await resend.emails.send({
  from: fromEmail,
  to: ['primary@gmail.com', 'secondary@gmail.com'],  // array of recipients
  subject: '...',
  html: '...',
})
```

### Option 4 — Add a New Verified Sender Address

If you want to send **from** a different address (e.g., `bookings@allanai.dev`):

1. You do **not** need to do anything in Cloudflare — the domain `allanai.dev` is already verified
2. Go to **Resend Dashboard → Domains → allanai.dev**
3. The domain is already verified — any `*@allanai.dev` address works as the sender
4. Update the env var:
   ```bash
   CONTACT_FORM_FROM_EMAIL=bookings@allanai.dev
   ```
5. Or hard-code it in the specific email utility

> **Note:** Resend authorizes the entire domain, not individual mailboxes. You don't create individual email addresses — you just use `anything@allanai.dev` as the `from` field.

### Option 5 — Completely Different Domain

To send from a second custom domain (e.g., `notifications@anotherdomain.com`):

1. Go to **Resend Dashboard → Domains → Add Domain**
2. Enter `anotherdomain.com`
3. Copy the DNS records Resend provides
4. Add them in Cloudflare (or wherever `anotherdomain.com` DNS is managed)
5. Click **Verify** in Resend
6. Once verified, use `anything@anotherdomain.com` as a `from` address

---

**Key Features:**
- ✅ Serverless-friendly (perfect for Vercel)
- ✅ TypeScript-first API
- ✅ Beautiful email templates
- ✅ High deliverability rates
- ✅ Free tier: 3,000 emails/month
- ✅ No credit card required to start

---

## Why Resend?

### Comparison with Alternatives

| Feature | Resend | SendGrid | Nodemailer + Gmail |
|---------|--------|----------|-------------------|
| Free Tier | 3,000/month | 100/day | 500/day |
| Serverless Support | ✅ Excellent | ✅ Good | ⚠️ Limited |
| Setup Complexity | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Complex |
| TypeScript Support | ✅ Native | ⚠️ Community | ⚠️ Community |
| Deliverability | ✅ High | ✅ High | ⚠️ Medium |
| Modern API | ✅ Yes | ❌ Legacy | ❌ Legacy |

**Recommendation:** Resend is the best choice for modern Next.js applications deployed on Vercel.

---

## Quick Start

### 1. Sign Up for Resend

1. Visit **https://resend.com**
2. Click "Sign Up" (free, no credit card required)
3. Verify your email address
4. You'll be redirected to the dashboard

### 2. Get Your API Key

1. In the Resend dashboard, click **"API Keys"** in the sidebar
2. Click **"Create API Key"**
3. Name it (e.g., "Resume Builder - Development")
4. Select permissions: **"Sending access"**
5. Click **"Create"**
6. **Copy the API key** (starts with `re_`)
   - ⚠️ **Important:** You can only see this once! Save it securely.

### 3. Add to Environment Variables

Create or update `.env.local`:

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Contact Form Settings
CONTACT_FORM_TO_EMAIL=your-email@gmail.com
CONTACT_FORM_FROM_EMAIL=onboarding@resend.dev
CONTACT_FORM_FROM_NAME=Your Name - Contact Form
```

### 4. Restart Development Server

**If using Docker:**
```bash
docker compose restart app
```

**If using npm directly:**
```bash
npm run dev
```

### 5. Test the Contact Form

1. Visit **http://localhost:3000/contact**
2. Fill out the form with your details
3. Click **"Send"**
4. Check your email inbox (the one you set in `CONTACT_FORM_TO_EMAIL`)

✅ **You should receive a beautifully formatted email!**

---

## Setup Instructions

### Development Setup

#### Step 1: Install Dependencies

Dependencies are already installed in this project:
- `resend@^6.9.4` - Resend SDK
- `zod@^4.3.6` - Schema validation

If you need to reinstall:
```bash
pnpm install resend zod
```

#### Step 2: Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Resend API key:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_FORM_TO_EMAIL=your-email@gmail.com
CONTACT_FORM_FROM_EMAIL=onboarding@resend.dev
CONTACT_FORM_FROM_NAME=Your Name - Contact Form
```

#### Step 3: Test Locally

Start the development server and test:
```bash
# Docker
docker compose up

# Or npm
npm run dev
```

Visit `http://localhost:3000/contact` and submit a test message.

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend API key | `re_xxxxxxxxxxxxx` |
| `CONTACT_FORM_TO_EMAIL` | Where emails are sent to (your inbox) | `your-email@gmail.com` |

### Optional Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `CONTACT_FORM_FROM_EMAIL` | Sender email address | `contact@yourdomain.com` | `onboarding@resend.dev` |
| `CONTACT_FORM_FROM_NAME` | Display name for sender | `John Doe - Contact Form` | `Contact Form` |
| `CONTACT_FORM_CC_EMAILS` | Additional recipients (comma-separated) | `backup@gmail.com,team@company.com` | None |

### Configuration Examples

#### Basic Setup (Testing)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_FORM_TO_EMAIL=your-email@gmail.com
CONTACT_FORM_FROM_EMAIL=onboarding@resend.dev
CONTACT_FORM_FROM_NAME=My Portfolio - Contact Form
```

#### Production Setup (Custom Domain)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_FORM_TO_EMAIL=your-email@gmail.com
CONTACT_FORM_FROM_EMAIL=contact@yourdomain.com
CONTACT_FORM_FROM_NAME=John Doe - Contact Form
CONTACT_FORM_CC_EMAILS=backup@gmail.com
```

---

## Domain Configuration

### Using Resend's Default Domain (Quick Start)

**Pros:**
- ✅ Works immediately
- ✅ No DNS setup required
- ✅ Good for testing

**Cons:**
- ❌ Generic sender address (`onboarding@resend.dev`)
- ❌ Less professional

**Setup:**
```bash
CONTACT_FORM_FROM_EMAIL=onboarding@resend.dev
```

### Using Your Own Domain (Recommended for Production)

**Pros:**
- ✅ Professional sender address (`contact@yourdomain.com`)
- ✅ Better deliverability
- ✅ Custom branding

**Cons:**
- ⚠️ Requires DNS configuration (~5 minutes)

#### Step-by-Step Domain Setup

1. **Add Domain in Resend Dashboard**
   - Go to **Domains** → **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Click **Add**

2. **Configure DNS Records**
   
   Resend will provide DNS records to add. Example:
   
   | Type | Name | Value |
   |------|------|-------|
   | TXT | `@` | `resend-verification=xxxxx` |
   | MX | `@` | `feedback-smtp.resend.com` (Priority: 10) |
   | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3...` |

3. **Add Records to Your DNS Provider**
   
   **Cloudflare Example:**
   - Go to your domain in Cloudflare
   - Click **DNS** → **Records**
   - Click **Add record**
   - Add each record from Resend
   - Save

   **Namecheap Example:**
   - Go to **Domain List** → Your domain → **Advanced DNS**
   - Add each record
   - Save

4. **Verify Domain**
   - Return to Resend dashboard
   - Click **Verify** next to your domain
   - Wait ~5 minutes for DNS propagation
   - Once verified, you'll see a green checkmark ✅

5. **Update Environment Variables**
   ```bash
   CONTACT_FORM_FROM_EMAIL=contact@yourdomain.com
   ```

6. **Test**
   - Send a test email from the contact form
   - Check that the FROM address is now your domain

---

## Testing

### Manual Testing

1. **Visit Contact Page**
   ```
   http://localhost:3000/contact
   ```

2. **Fill Out Form**
   - Name: Your Name
   - Email: your-test-email@gmail.com
   - Company: (optional)
   - Message: Test message
   - Referral: (optional)

3. **Submit and Verify**
   - Click "Send"
   - Wait for success message
   - Check your inbox (the email in `CONTACT_FORM_TO_EMAIL`)

### Expected Email Format

**Subject:** `New Contact Form Submission from [Name]`

**From:** `Contact Form <contact@yourdomain.com>` or `Contact Form <onboarding@resend.dev>`

**Reply-To:** `sender-email@example.com` (the email from the form)

**Body:** Beautiful HTML email with:
- Gradient header
- All form fields formatted
- Metadata (IP address, timestamp)

### Testing Anti-Spam Protection

#### Test Rate Limiting
1. Submit 3 forms quickly
2. Try a 4th submission
3. Should see error: "Too many requests"

#### Test Honeypot
1. Open browser DevTools → Console
2. Run: `document.querySelector('input[name="honeypot"]').value = "spam"`
3. Submit form
4. Should succeed but email won't be sent (bot detected)

#### Test Validation
1. Try submitting with invalid email
2. Try submitting with message < 10 characters
3. Should see validation errors

---

## Production Deployment

### Vercel Deployment

1. **Add Environment Variables in Vercel**
   - Go to your project in Vercel dashboard
   - Click **Settings** → **Environment Variables**
   - Add each variable:
     ```
     RESEND_API_KEY=re_xxxxxxxxxxxxx
     CONTACT_FORM_TO_EMAIL=your-email@gmail.com
     CONTACT_FORM_FROM_EMAIL=contact@yourdomain.com
     CONTACT_FORM_FROM_NAME=Your Name - Contact Form
     ```
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

2. **Redeploy**
   ```bash
   git push origin main
   ```
   Or click **Redeploy** in Vercel dashboard

3. **Test Production**
   - Visit `https://yourdomain.com/contact`
   - Submit a test form
   - Verify email delivery

### Environment-Specific Configuration

**Development:**
```bash
CONTACT_FORM_FROM_EMAIL=onboarding@resend.dev
```

**Production:**
```bash
CONTACT_FORM_FROM_EMAIL=contact@yourdomain.com
```

You can set different values in Vercel for each environment.

---

## Troubleshooting

### Common Issues

#### 1. "Module not found: Can't resolve 'resend'"

**Cause:** Dependencies not installed or dev server not restarted.

**Solution:**
```bash
# Install dependencies
pnpm install

# Restart Docker
docker compose restart app

# Or restart npm
npm run dev
```

#### 2. "Configuration error: CONTACT_FORM_TO_EMAIL not set"

**Cause:** Environment variables not configured.

**Solution:**
1. Check `.env.local` exists
2. Verify `CONTACT_FORM_TO_EMAIL` is set
3. Restart server

#### 3. Emails Not Arriving

**Possible Causes:**
- ❌ Wrong email address in `CONTACT_FORM_TO_EMAIL`
- ❌ Email in spam folder
- ❌ Invalid Resend API key
- ❌ Domain not verified (if using custom domain)

**Solution:**
1. Check spam folder
2. Verify API key in Resend dashboard
3. Check Resend dashboard → **Logs** for delivery status
4. Verify domain is verified (if using custom domain)

#### 4. "Too many requests" Error

**Cause:** Rate limiting (3 submissions per hour per IP).

**Solution:**
- Wait 1 hour
- Or restart server (clears in-memory rate limit)
- Or use different IP (VPN, mobile hotspot)

#### 5. Emails Going to Spam

**Cause:** Using `onboarding@resend.dev` or domain not properly configured.

**Solution:**
1. Set up custom domain with proper DNS records
2. Verify domain in Resend
3. Use `CONTACT_FORM_FROM_EMAIL=contact@yourdomain.com`

---

## Best Practices

### Security

✅ **Do:**
- Store API keys in environment variables (never commit to Git)
- Use rate limiting (already implemented)
- Validate all inputs server-side (already implemented)
- Use honeypot fields (already implemented)
- Monitor Resend logs for suspicious activity

❌ **Don't:**
- Hardcode API keys in code
- Disable rate limiting
- Trust client-side validation only
- Expose API keys in client-side code

### Email Deliverability

✅ **Do:**
- Use custom domain for production
- Verify domain with proper DNS records
- Keep email content professional
- Use descriptive subject lines
- Include plain text fallback (already implemented)

❌ **Don't:**
- Use generic domains for production
- Send spam or unsolicited emails
- Use misleading subject lines
- Send only HTML emails

### Performance

✅ **Do:**
- Use serverless functions (already implemented)
- Keep email templates lightweight
- Monitor API usage in Resend dashboard
- Set up error logging

❌ **Don't:**
- Send emails from client-side
- Include large attachments
- Make synchronous API calls in critical paths

### Monitoring

**Check Resend Dashboard Regularly:**
1. Go to **Logs** to see all sent emails
2. Monitor delivery rates
3. Check for errors or bounces
4. Review API usage

**Set Up Alerts:**
- Monitor error logs in your application
- Set up Vercel log alerts
- Check Resend webhook events (optional)

---

## API Reference

### Contact Form API Endpoint

**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc", // optional
  "message": "I'd like to discuss a project...",
  "referral": "LinkedIn", // optional
  "honeypot": "" // must be empty (anti-spam)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Your message has been sent successfully!"
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "error": "Validation failed",
  "message": "Email must be a valid email address"
}
```

**429 - Rate Limit:**
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the maximum number of submissions. Please try again later."
}
```

**500 - Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

### Rate Limiting

- **Limit:** 3 submissions per IP per hour
- **Window:** 1 hour (3600 seconds)
- **Storage:** In-memory (resets on deployment)
- **Headers:**
  - `X-RateLimit-Limit: 3`
  - `X-RateLimit-Remaining: 2`

### Resend SDK Usage

The contact form uses the Resend SDK internally:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Contact Form <contact@yourdomain.com>',
  to: 'your-email@gmail.com',
  replyTo: 'sender@example.com',
  subject: 'New Contact Form Submission',
  html: '<html>...</html>',
  text: 'Plain text version...',
})
```

**Official Documentation:** https://resend.com/docs

---

## Additional Resources

### Official Links
- **Resend Website:** https://resend.com
- **Resend Documentation:** https://resend.com/docs
- **Resend Dashboard:** https://resend.com/dashboard
- **Resend Status:** https://status.resend.com

### Related Documentation
- [Contact Form Implementation](./CONTACT_FORM.md) (if exists)
- [Environment Variables](./../.env.example)
- [API Routes](./API.md) (if exists)

### Support
- **Resend Support:** support@resend.com
- **Resend Discord:** https://resend.com/discord
- **GitHub Issues:** https://github.com/resendlabs/resend-node/issues

---

## Changelog

### v1.0.0 (2026-03-30)
- Initial Resend integration
- Contact form implementation
- Multi-layer anti-spam protection
- Environment variable configuration
- HTML email templates
- Rate limiting (3 per hour per IP)
- Comprehensive documentation

---

## License

This documentation is part of the Resume Builder project. See the main LICENSE file for details.
