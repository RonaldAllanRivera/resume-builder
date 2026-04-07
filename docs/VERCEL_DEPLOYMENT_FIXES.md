# Vercel Deployment Fixes

This document summarizes the fixes applied to resolve Vercel deployment issues.

## Issues Fixed

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

### 2. PostgreSQL SSL Warnings

**Problem**: SSL mode warnings appearing in logs:
```
SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'
```

**Solution**:
- Enabled SSL explicitly for production connections in `src/payload.config.ts`
- Database pool configuration now sets `ssl: true` in production

**Files Changed**:
- `src/payload.config.ts` - Added SSL configuration to database pool

### 3. Missing Storage Adapter (Non-Critical)

**Problem**: Warning about missing storage adapter for media collection on Vercel:
```
Collections with uploads enabled require a storage adapter when deploying to Vercel
```

**Impact**: Media uploads may not work properly in production, but this doesn't break the build.

**Future Solution**: To be fixed by adding `@payloadcms/storage-vercel-blob` adapter (requires Vercel Blob setup).

### 4. Stripe Initialization (Previous Fix)

**Problem**: `STRIPE_SECRET_KEY` not set during build causing build failures.

**Solution**: Implemented lazy initialization of Stripe client.

**Files Changed**:
- `src/lib/stripe.ts` - Lazy initialization with `getStripe()` function
- `src/app/api/bookings/checkout/route.ts` - Updated to use `getStripe()`
- `src/app/api/webhooks/stripe/route.ts` - Updated to use `getStripe()`

### 5. Prerendering Database Errors (Previous Fix)

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

# Payload
PAYLOAD_SECRET=your-secret

# Stripe (for booking system)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
NEXT_PUBLIC_SERVER_URL=https://www.allanai.dev
NEXT_PUBLIC_CMS_URL=https://www.allanai.dev
```

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

## Related Files

- Build script: `scripts/vercel-build.sh`
- Vercel config: `vercel.json`
- Package scripts: `package.json`
- Payload config: `src/payload.config.ts`
