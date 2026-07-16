# Vercel Deployment Fixes

This document summarizes the fixes applied to resolve Vercel deployment issues.

## Issues Fixed

### 0. Production warnings — email adapter, Blob storage, SSL mode (2026-05-13)

**Problem**: Three warnings in Vercel logs:

1. `No email adapter provided. Email will be written to console.` → Payload-internal emails (admin password reset, form-builder submissions) silently logged instead of sent.
2. `Collections with uploads enabled require a storage adapter when deploying to Vercel.` → Media uploads succeeded in the admin but vanished on the next deploy.
3. `SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.` → pg v9 will silently downgrade `sslmode=require` to weaker libpq semantics (no cert hostname verification).

**Code fixes (already in the repo on this commit)**:
- `@payloadcms/email-resend@3.74.0` installed and wired as `email: resendAdapter(...)` in `src/payload.config.ts`
- `@payloadcms/storage-vercel-blob@3.74.0` installed and added as a plugin scoped to the `media` collection; auto-disables locally when `BLOB_READ_WRITE_TOKEN` is unset
- SSL detection in `db: postgresAdapter` now recognizes `sslmode=verify-full` in addition to `sslmode=require`

**Dashboard actions required (do these in the Vercel dashboard / Resend dashboard)**: see the [Dashboard Runbook](#dashboard-runbook-for-issue-0-2026-05-13) below.

---

## Dashboard runbook for Issue 0 (2026-05-13)

Three dashboard actions are needed to fully activate the code fixes. Do them in order, redeploy, then verify.

### Step 1 — Update `DATABASE_URL` to use `sslmode=verify-full`

1. Vercel dashboard → your project → **Settings → Environment Variables**
2. Find `DATABASE_URL`. Edit it.
3. Look at the current query string. If it has `?sslmode=require` (or `?ssl=true` etc.), change to `?sslmode=verify-full`. If the URL has no `sslmode`, append `?sslmode=verify-full` (or `&sslmode=verify-full` if there's already a `?`).
   - Example before: `postgres://user:pass@host.neon.tech/db?sslmode=require`
   - Example after:  `postgres://user:pass@host.neon.tech/db?sslmode=verify-full`
4. Save → **Redeploy** the project.

**Local `.env`**: optionally apply the same change so local dev matches prod behavior. Skip if your local DB is bare Docker without TLS (the current `127.0.0.1:5432` connection in `.env.example` doesn't use SSL at all).

### Step 2 — Provision Vercel Blob and verify the token

If you've never used Vercel Blob in this project:

1. Vercel dashboard → your project → **Storage** tab
2. Click **Create Database** → select **Blob**
3. Name it (e.g. `resume-builder-media`) and confirm
4. Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into the project env vars for all environments. Verify it appears under **Settings → Environment Variables**.
5. **Redeploy** so the new env var is picked up.

If you already have a Blob store: just confirm `BLOB_READ_WRITE_TOKEN` is set in Production env vars.

Free tier covers ~1 GB storage + light bandwidth, plenty for a portfolio.

### Step 3 — Verify the Resend sender domain

`resendAdapter` will send emails from whatever `CONTACT_FORM_FROM_EMAIL` points at. If that domain isn't verified in Resend, emails deliver but with poor reputation (often spam-filtered) — or get outright rejected.

1. [resend.com/domains](https://resend.com/domains) → click **Add Domain**
2. Enter your sending domain (e.g. `allanai.dev`)
3. Resend gives you 3-4 DNS records to add (SPF, DKIM, MX or return-path). Add them at your DNS provider (Vercel domains, Cloudflare, wherever).
4. Wait for verification — typically 5-30 min after DNS propagates. Resend dashboard shows green checkmarks per record.
5. Once verified, set `CONTACT_FORM_FROM_EMAIL` in Vercel to an address on that domain (e.g. `noreply@allanai.dev`).

If you don't have a verified domain yet, Resend's free tier lets you send from `onboarding@resend.dev` for testing — set `CONTACT_FORM_FROM_EMAIL=onboarding@resend.dev` for now and migrate later.

### Step 4 — Verify everything in production

After all three steps + a deploy:

- [ ] Vercel function logs no longer show the `No email adapter`, `Collections with uploads`, or `SECURITY WARNING` lines.
- [ ] Upload a test image via `/admin` → check that the image URL points to `*.public.blob.vercel-storage.com` (not `/media/*` on your domain). That confirms Vercel Blob is active.
- [ ] Redeploy the project → revisit the uploaded image. If the URL still works, the file persisted (proof of fix). If it 404s, Blob isn't actually wired — recheck `BLOB_READ_WRITE_TOKEN`.
- [ ] Trigger a Payload-internal email (e.g. request an admin password reset) → confirm it actually arrives in your inbox, not just the Vercel logs.

### Rollback

If anything goes wrong, the runbook is fully reversible:
- Revert `DATABASE_URL` back to its previous `sslmode=` value (warning returns, no functional change).
- Remove the `BLOB_READ_WRITE_TOKEN` env var → `vercelBlobStorage` auto-disables → uploads fall back to `public/media` (warning returns, no immediate data loss but new uploads ephemeral).
- The email adapter has no failure mode that breaks production — at worst, emails fall back to console.log if the Resend API key is missing.

---

### 1. Database Migration Issues

**Problem**: Database tables and columns were missing in production, causing 500 errors.
- `packages` table didn't exist
- `payload_locked_documents__rels.packages_id` column was missing
- Payload CMS schema was out of sync with the database

**Solution**:
- Created `scripts/vercel-build.sh` to run database migrations during the build process
- Added migration scripts to `package.json`:
  - `pnpm migrate` - Run Payload migrations
  - `pnpm migrate:status` - Check migration status
- Updated `vercel.json` to use the custom build script

**Files Changed**:
- `scripts/vercel-build.sh` - New build script with migrations
- `package.json` - Added migrate scripts
- `vercel.json` - Updated build command

### 2. PostgreSQL SSL Configuration

**Problem**: 
- SSL mode warnings in production logs
- GitHub Actions CI builds failing because test database doesn't support SSL
- Need SSL for Vercel Postgres but not for local/CI environments

**Solution**:
- Implemented smart SSL detection in `src/payload.config.ts`:
  - SSL enabled if `DATABASE_URL` contains `.vercel-storage.com`
  - SSL enabled if `DATABASE_URL` contains `sslmode=require`
  - SSL enabled if `DATABASE_SSL=true` environment variable is set
  - SSL disabled for localhost/CI environments (default)
- Added `DATABASE_SSL=true` to `vercel.json` for production deployments

**Files Changed**:
- `src/payload.config.ts` - Smart SSL configuration
- `vercel.json` - Added `DATABASE_SSL: "true"` environment variable

### 3. Missing Storage Adapter (Non-Critical)

**Problem**: Warning about missing storage adapter for media collection on Vercel:
```
Collections with uploads enabled require a storage adapter when deploying to Vercel
```

**Impact**: Media uploads may not work properly in production, but this doesn't break the build.

**Future Solution**: To be fixed by adding `@payloadcms/storage-vercel-blob` adapter (requires Vercel Blob setup).

### 4. Prerendering Database Errors (Previous Fix)

**Problem**: Pages trying to query database during build time.

**Solution**: Added `export const dynamic = 'force-dynamic'` to data-fetching pages.

**Files Changed**:
- `src/app/(frontend)/pricing/page.tsx`
- `src/app/(frontend)/book/[packageSlug]/page.tsx`
- `src/app/(frontend)/book/success/page.tsx`
- `src/app/(frontend)/book/cancel/page.tsx`

## Environment Variables Required

Make sure these are set in Vercel:

```env
# Database
DATABASE_URL=postgresql://...
DATABASE_SSL=true  # Set automatically in vercel.json

# Payload
PAYLOAD_SECRET=your-secret

# URLs
NEXT_PUBLIC_SERVER_URL=https://www.allanai.dev
NEXT_PUBLIC_CMS_URL=https://www.allanai.dev
```

**Note**: `DATABASE_SSL` is automatically set to `true` in `vercel.json`. Only add it manually to Vercel environment variables if you need to override this for specific environments.

## Build Process

The Vercel build now follows this order:
1. Install dependencies (`pnpm install`)
2. Run database initialization (`pnpm init:db`)
3. Check migration status (`pnpm migrate:status`)
4. Run migrations (`pnpm migrate`)
5. Build Next.js application (`next build`)

## Testing

To verify the deployment:
1. Check that `/admin` loads without 500 errors
2. Check that `/pricing` page loads correctly
3. Verify database tables exist by checking logs

## Troubleshooting

If you still see database errors after deployment:
1. Check Vercel logs for migration output
2. Verify `DATABASE_URL` is correctly set
3. Manually run migrations via Vercel CLI if needed:
   ```bash
   vercel --prod
   ```
   Then in the build logs, check the migration output.

### Manual Database Initialization

If automatic migrations fail during build, you can manually initialize the database:

**Option 1: Use the API endpoint (after deployment)**
```bash
curl -X POST https://www.allanai.dev/api/init-db \
  -H "Authorization: Bearer YOUR_CRON_SECRET_OR_PAYLOAD_SECRET"
```

**Option 2: Run locally with production database**
```bash
# Set your production DATABASE_URL locally
export DATABASE_URL="your-production-database-url"
export PAYLOAD_SECRET="your-secret"

# Run initialization
pnpm init:db

# Or run migrations
pnpm migrate
```

**Option 3: Use Vercel CLI to run commands**
```bash
# Connect to your project
vercel --prod

# Run the init command
vercel env add DATABASE_URL  # if not set
vercel run pnpm init:db
```

## Related Files

- Build script: `scripts/vercel-build.sh`
- Vercel config: `vercel.json`
- Package scripts: `package.json`
- Payload config: `src/payload.config.ts`
