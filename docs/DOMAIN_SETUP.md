# Custom Domain Setup Guide (allanai.dev)

Complete guide for configuring your custom domain across all services: Vercel, Cloudflare, Resend, and Google OAuth.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Vercel Domain Configuration](#step-1-vercel-domain-configuration)
- [Step 2: Cloudflare DNS Setup](#step-2-cloudflare-dns-setup)
- [Step 3: Resend Email Domain](#step-3-resend-email-domain)
- [Step 4: Google OAuth Update](#step-4-google-oauth-update)
- [Step 5: Environment Variables](#step-5-environment-variables)
- [Step 6: Testing](#step-6-testing)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)

---

## Overview

This guide walks you through setting up `allanai.dev` as your production domain for the Resume Builder application. You'll configure:

- ✅ Vercel hosting and deployment
- ✅ Cloudflare DNS management
- ✅ Resend email service (`contact@allanai.dev`)
- ✅ Google OAuth authentication
- ✅ SSL/TLS certificates (automatic)
- ✅ Environment variables for production

**Estimated Time:** 30-45 minutes

---

## Prerequisites

Before starting, ensure you have:

- ✅ Domain purchased: `allanai.dev` (via Cloudflare)
- ✅ Vercel account with project deployed
- ✅ Resend account with API key
- ✅ Google Cloud Console project with OAuth configured
- ✅ Access to Cloudflare DNS management
- ✅ Local development environment working

---

## Step 1: Vercel Domain Configuration

### 1.1 Add Domain to Vercel Project

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your Resume Builder project

2. **Add Domain**
   - Click **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `allanai.dev`
   - Click **Add**

3. **Add www Subdomain (Optional)**
   - Add: `www.allanai.dev`
   - Vercel will automatically redirect `www` to apex domain

4. **Note DNS Records**
   - Vercel will provide DNS records to add
   - Keep this tab open for Step 2

**Expected DNS Records from Vercel:**
```
Type: A     | Name: @              | Value: 76.76.21.21
Type: CNAME | Name: www            | Value: cname.vercel-dns.com
```

---

## Step 2: Cloudflare DNS Setup

### 2.1 Configure DNS Records for Vercel

1. **Log in to Cloudflare**
   - Go to https://dash.cloudflare.com
   - Select `allanai.dev` domain

2. **Add Vercel DNS Records**
   
   **Record 1: Apex Domain (A Record)**
   ```
   Type: A
   Name: @
   IPv4 address: 76.76.21.21
   TTL: Auto
   Proxy status: Proxied (orange cloud) ✅
   ```
   
   **Record 2: WWW Subdomain (CNAME)**
   ```
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   TTL: Auto
   Proxy status: Proxied (orange cloud) ✅
   ```

3. **Verify Existing Resend Records**
   
   Ensure these records exist (from Resend auto-configure):
   ```
   Type: TXT | Name: @                    | Content: resend-verification=xxx
   Type: MX  | Name: @                    | Content: feedback-smtp.resend.com (Priority: 10)
   Type: TXT | Name: resend._domainkey   | Content: v=DKIM1; k=rsa; p=...
   ```

### 2.2 SSL/TLS Configuration

1. **In Cloudflare Dashboard**
   - Go to **SSL/TLS** → **Overview**
   - Set encryption mode: **Full (strict)** ✅
   - This ensures end-to-end encryption

2. **Enable Always Use HTTPS**
   - Go to **SSL/TLS** → **Edge Certificates**
   - Toggle **Always Use HTTPS**: ON ✅

3. **Enable Automatic HTTPS Rewrites**
   - Toggle **Automatic HTTPS Rewrites**: ON ✅

### 2.3 Wait for DNS Propagation

- DNS changes can take 5-30 minutes
- Check status: https://dnschecker.org
- Vercel will automatically detect when DNS is ready

---

## Step 3: Resend Email Domain

### 3.1 Verify Domain Status

1. **Go to Resend Dashboard**
   - Visit https://resend.com/domains
   - Find `allanai.dev`
   - Status should show: ✅ **Verified**

2. **If Not Verified**
   - Click **Verify** button
   - Wait 5-10 minutes for DNS propagation
   - Refresh and verify again

### 3.2 Test Email Sending

1. **Send Test Email**
   - In Resend dashboard, click **Send Test Email**
   - From: `contact@allanai.dev`
   - To: Your email address
   - Click **Send**

2. **Verify Delivery**
   - Check your inbox
   - Verify FROM address shows `contact@allanai.dev`
   - Check it's not in spam folder

---

## Step 4: Google OAuth Update

### 4.1 Update OAuth Consent Screen

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Select your project

2. **Update OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Click **Edit App**
   - Update **Application home page**: `https://allanai.dev`
   - Update **Application privacy policy link**: `https://allanai.dev/privacy` (if exists)
   - Update **Application terms of service link**: `https://allanai.dev/terms` (if exists)
   - Click **Save and Continue**

### 4.2 Update OAuth Credentials

1. **Go to Credentials**
   - Click **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID

2. **Add Authorized JavaScript Origins**
   ```
   https://allanai.dev
   https://www.allanai.dev
   ```
   
   **Keep existing:**
   ```
   http://localhost:3000
   ```

3. **Add Authorized Redirect URIs**
   ```
   https://allanai.dev/api/auth/callback/google
   https://www.allanai.dev/api/auth/callback/google
   https://allanai.dev/admin/api/auth/callback/google
   https://www.allanai.dev/admin/api/auth/callback/google
   ```
   
   **Keep existing:**
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/admin/api/auth/callback/google
   ```

4. **Save Changes**
   - Click **Save**
   - Wait 5 minutes for changes to propagate

---

## Step 5: Environment Variables

### 5.1 Update Vercel Environment Variables

1. **Go to Vercel Project Settings**
   - Dashboard → Your Project → **Settings** → **Environment Variables**

2. **Update/Add These Variables**

   **Core Configuration:**
   ```bash
   NEXT_PUBLIC_SERVER_URL=https://allanai.dev
   ```

   **Contact Form (Resend):**
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   CONTACT_FORM_TO_EMAIL=your-email@gmail.com
   CONTACT_FORM_FROM_EMAIL=contact@allanai.dev
   CONTACT_FORM_FROM_NAME=Ronald Allan Rivera - Contact Form
   ```

   **Database:**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

   **Payload CMS:**
   ```bash
   PAYLOAD_SECRET=your-secret-here
   ```

   **Google OAuth:**
   ```bash
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   GOOGLE_REDIRECT_URI=https://allanai.dev/api/auth/callback/google
   ```

   **Other Services:**
   ```bash
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
   OPENAI_API_KEY=sk-xxx
   GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=base64_encoded_json
   GOOGLE_DRIVE_FOLDER_ID=folder_id
   ```

3. **Set Environment Scope**
   - For each variable, select: **Production**, **Preview**, **Development**
   - Or select only **Production** for production-only values

4. **Save All Variables**

### 5.2 Redeploy Application

After updating environment variables:

```bash
# Option 1: Push to trigger deployment
git add .
git commit -m "Update environment variables for allanai.dev"
git push origin main

# Option 2: Manual redeploy in Vercel dashboard
# Go to Deployments → Click "..." → Redeploy
```

---

## Step 6: Testing

### 6.1 Wait for Deployment

1. **Monitor Deployment**
   - Go to Vercel Dashboard → **Deployments**
   - Wait for deployment to complete (2-5 minutes)
   - Status should show: ✅ **Ready**

2. **Check Domain Status**
   - Go to **Settings** → **Domains**
   - Both domains should show: ✅ **Valid Configuration**

### 6.2 Test Website Access

1. **Visit Your Domain**
   ```
   https://allanai.dev
   ```

2. **Verify SSL Certificate**
   - Click padlock icon in browser
   - Certificate should be valid
   - Issued by: Let's Encrypt or Cloudflare

3. **Test All Pages**
   - Homepage: `https://allanai.dev`
   - Projects: `https://allanai.dev/projects`
   - Certifications: `https://allanai.dev/certifications`
   - Contact: `https://allanai.dev/contact`
   - Admin: `https://allanai.dev/admin`

### 6.3 Test Contact Form

1. **Visit Contact Page**
   ```
   https://allanai.dev/contact
   ```

2. **Submit Test Message**
   - Fill out all fields
   - Click "Send"
   - Should see success message

3. **Verify Email Delivery**
   - Check your inbox (email in `CONTACT_FORM_TO_EMAIL`)
   - FROM should show: `contact@allanai.dev`
   - Email should have beautiful HTML formatting

### 6.4 Test Google OAuth

1. **Visit Admin Panel**
   ```
   https://allanai.dev/admin
   ```

2. **Test Google Sign-In**
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After authorization, should redirect back to admin
   - Should be logged in successfully

3. **Test Google Drive Export**
   - Go to admin panel
   - Try exporting resume to Google Drive
   - Verify file appears in your Drive

### 6.5 Test API Routes

**Health Check:**
```bash
curl https://allanai.dev/api/health
```

**Expected Response:**
```json
{"status":"ok"}
```

---

## Troubleshooting

### Issue: Domain Not Resolving

**Symptoms:**
- `allanai.dev` shows "DNS_PROBE_FINISHED_NXDOMAIN"
- Site not accessible

**Solutions:**
1. Check DNS records in Cloudflare
2. Verify A record points to Vercel IP: `76.76.21.21`
3. Wait 30 minutes for DNS propagation
4. Clear browser cache: `Ctrl+Shift+Delete`
5. Try incognito mode
6. Check DNS: https://dnschecker.org

### Issue: SSL Certificate Error

**Symptoms:**
- "Your connection is not private" warning
- SSL certificate invalid

**Solutions:**
1. In Cloudflare, set SSL/TLS to **Full (strict)**
2. Enable **Always Use HTTPS**
3. Wait 15 minutes for certificate provisioning
4. Clear browser cache
5. Try different browser

### Issue: Contact Form Not Sending

**Symptoms:**
- Form submits but no email received
- Error message on submission

**Solutions:**
1. Check Resend dashboard → **Logs**
2. Verify domain is verified in Resend
3. Check environment variables in Vercel:
   - `RESEND_API_KEY` is correct
   - `CONTACT_FORM_TO_EMAIL` is correct
   - `CONTACT_FORM_FROM_EMAIL=contact@allanai.dev`
4. Check spam folder
5. Test with Resend dashboard "Send Test Email"

### Issue: Google OAuth Fails

**Symptoms:**
- Redirect URI mismatch error
- "Error 400: redirect_uri_mismatch"

**Solutions:**
1. Verify redirect URIs in Google Cloud Console:
   ```
   https://allanai.dev/api/auth/callback/google
   https://allanai.dev/admin/api/auth/callback/google
   ```
2. Check `GOOGLE_REDIRECT_URI` in Vercel environment variables
3. Wait 5 minutes after updating Google OAuth settings
4. Clear browser cookies
5. Try incognito mode

### Issue: Environment Variables Not Working

**Symptoms:**
- Features not working on production
- "Configuration error" messages

**Solutions:**
1. Go to Vercel → Settings → Environment Variables
2. Verify all variables are set for **Production**
3. Check for typos in variable names
4. Redeploy after updating variables:
   - Deployments → "..." → Redeploy
5. Check deployment logs for errors

---

## Production Checklist

Before going live, verify:

### Domain & DNS
- [ ] `allanai.dev` resolves correctly
- [ ] `www.allanai.dev` redirects to apex domain
- [ ] SSL certificate is valid (green padlock)
- [ ] HTTPS is enforced (no HTTP access)

### Email (Resend)
- [ ] Domain verified in Resend dashboard
- [ ] Test email sent successfully from `contact@allanai.dev`
- [ ] Email not going to spam
- [ ] Contact form working on production

### Google OAuth
- [ ] Authorized JavaScript origins updated
- [ ] Authorized redirect URIs updated
- [ ] OAuth consent screen updated with new domain
- [ ] Google sign-in working on production
- [ ] Google Drive export working

### Environment Variables
- [ ] `NEXT_PUBLIC_SERVER_URL=https://allanai.dev`
- [ ] `CONTACT_FORM_FROM_EMAIL=contact@allanai.dev`
- [ ] `GOOGLE_REDIRECT_URI` updated
- [ ] All API keys and secrets set
- [ ] Database connection string correct

### Testing
- [ ] All pages load correctly
- [ ] Contact form sends emails
- [ ] Google OAuth authentication works
- [ ] Admin panel accessible
- [ ] API routes respond correctly
- [ ] No console errors in browser
- [ ] Mobile responsive design works

### Performance & SEO
- [ ] Lighthouse score > 90
- [ ] Meta tags and OpenGraph correct
- [ ] Sitemap accessible: `https://allanai.dev/sitemap.xml`
- [ ] Robots.txt correct: `https://allanai.dev/robots.txt`
- [ ] Favicon loads correctly

### Security
- [ ] SSL/TLS certificate valid
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] API keys not exposed in client-side code
- [ ] Rate limiting working on contact form

---

## Quick Reference

### Important URLs

**Production:**
- Website: https://allanai.dev
- Admin: https://allanai.dev/admin
- Contact: https://allanai.dev/contact
- API Health: https://allanai.dev/api/health

**Services:**
- Vercel: https://vercel.com/dashboard
- Cloudflare: https://dash.cloudflare.com
- Resend: https://resend.com/dashboard
- Google Cloud: https://console.cloud.google.com

### DNS Records Summary

```
# Vercel (Website)
Type: A     | Name: @              | Value: 76.76.21.21          | Proxy: ON
Type: CNAME | Name: www            | Value: cname.vercel-dns.com | Proxy: ON

# Resend (Email)
Type: TXT   | Name: @              | Value: resend-verification=xxx
Type: MX    | Name: @              | Value: feedback-smtp.resend.com (Priority: 10)
Type: TXT   | Name: resend._domainkey | Value: v=DKIM1; k=rsa; p=...
```

### Environment Variables Template

```bash
# Core
NEXT_PUBLIC_SERVER_URL=https://allanai.dev
DATABASE_URL=postgresql://...
PAYLOAD_SECRET=...

# Contact Form
RESEND_API_KEY=re_...
CONTACT_FORM_TO_EMAIL=your-email@gmail.com
CONTACT_FORM_FROM_EMAIL=contact@allanai.dev
CONTACT_FORM_FROM_NAME=Ronald Allan Rivera - Contact Form

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://allanai.dev/api/auth/callback/google
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
GOOGLE_DRIVE_FOLDER_ID=...

# Other Services
BLOB_READ_WRITE_TOKEN=...
OPENAI_API_KEY=sk-...
```

---

## Next Steps

After completing this setup:

1. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor Resend email logs
   - Review error logs

2. **Set Up Monitoring**
   - Configure uptime monitoring (e.g., UptimeRobot)
   - Set up error tracking (e.g., Sentry)
   - Enable Vercel Web Analytics

3. **Optimize SEO**
   - Submit sitemap to Google Search Console
   - Verify domain ownership
   - Set up Google Analytics

4. **Backup Strategy**
   - Regular database backups
   - Export important data
   - Document recovery procedures

---

## Support

If you encounter issues:

1. **Check Documentation**
   - [Vercel Docs](https://vercel.com/docs)
   - [Cloudflare Docs](https://developers.cloudflare.com)
   - [Resend Docs](https://resend.com/docs)
   - [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)

2. **Check Service Status**
   - Vercel: https://www.vercel-status.com
   - Cloudflare: https://www.cloudflarestatus.com
   - Resend: https://status.resend.com

3. **Community Support**
   - Vercel Discord
   - Resend Discord
   - Stack Overflow

---

## Changelog

### v1.0.0 (2026-03-30)
- Initial domain setup guide for allanai.dev
- Vercel, Cloudflare, Resend, and Google OAuth configuration
- Comprehensive testing and troubleshooting sections
- Production deployment checklist

---

## License

This documentation is part of the Resume Builder project. See the main LICENSE file for details.
