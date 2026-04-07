# Vercel Deployment Guide

Complete guide for deploying this Next.js + Payload CMS application to Vercel.

## Prerequisites

- GitHub account with your repository pushed
- Vercel account (free tier works fine)
- PostgreSQL database (Neon, Vercel Postgres, or any PostgreSQL provider)
- Vercel Blob storage account (for media uploads)

## Booking System Deployment

The booking system requires additional setup after deployment to initialize the database collections.

### Step 1: Deploy to Vercel

Follow the standard Vercel deployment process through their dashboard or GitHub integration.

### Step 2: Initialize Booking System

**Vercel Serverless Environment Only** - The npm script won't work on Vercel. Use one of these methods:

#### Method 1: API Endpoint (Recommended)
Call the API endpoint once after deployment:

```bash
curl -X POST https://your-domain.vercel.app/api/init-booking-system \
  -H "Content-Type: application/json"
```

#### Method 2: Vercel Cron Job (Automatic)
The `vercel.json` includes a cron job that runs daily at 2 AM. It will automatically initialize the booking system on first run.

#### Method 3: Manual Trigger in Vercel Dashboard
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Find `/api/init-booking-system`
5. Click "Invoke" or test the function

### Step 3: Verify Booking System

After initialization:
1. Check admin panel: `https://your-domain.vercel.app/admin`
2. Verify "Booking" group appears in admin menu
3. Check pricing page: `https://your-domain.vercel.app/pricing`

### Common Issues

**Error: "relation packages does not exist"**
- Solution: Run the initialization script as described above

**Error: "column packages_id does not exist"**  
- Solution: This is fixed by running the initialization script

**Admin panel shows 500 error**
- Check that booking collections were created
- Verify database connection in Vercel logs

## Key Differences from Render

| Feature | Render | Vercel |
|---------|--------|--------|
| **Deployment** | Manual Docker builds | Automatic from Git |
| **Environment** | Single long-running server | Serverless functions |
| **Database** | Included PostgreSQL | External (Neon recommended) |
| **File Storage** | Persistent disk | Vercel Blob (required) |
| **Build Time** | ~5-10 minutes | ~2-3 minutes |
| **Cold Starts** | None | ~1-2 seconds |
| **Pricing** | $7/month minimum | Free tier available |

## Step-by-Step Deployment

### 1. Prepare Your Repository

**Commit and push all changes:**

```bash
# Make sure you're on the main branch
git branch

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "feat(rainbow): add animated 3D starfield and unified project cards"

# Push to GitHub
git push origin main
```

**Important:** Vercel deploys from Git, so all changes must be committed and pushed.

---

### 2. Set Up PostgreSQL Database (Neon Recommended)

**Option A: Neon (Recommended - Free tier available)**

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create a new project:
   - Name: `resume-builder-prod`
   - Region: Choose closest to your users
   - PostgreSQL version: 16 (latest)
4. Copy the connection string:
   - Format: `postgresql://user:password@host/database?sslmode=require`
   - Save this for later (you'll need it in Vercel)

**Option B: Vercel Postgres**

1. In Vercel dashboard → Storage → Create Database
2. Choose Postgres
3. Select region
4. Copy connection string

**Option C: Other providers (Supabase, Railway, AWS RDS)**
- Any PostgreSQL 14+ database works
- Make sure it's publicly accessible
- Connection string must include `?sslmode=require`

---

### 3. Set Up Vercel Blob Storage (OPTIONAL - Can Skip for Now)

**Why needed:** Vercel's serverless environment doesn't have persistent file storage. Blob storage is only needed if you want to upload images via the admin panel in production.

**You can skip this step if:**
- You manage all content locally and commit images to Git
- You don't need admin uploads in production
- You want to keep costs at $0 (free tier)

**Set up later if needed:**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database
3. Choose **Blob**
4. Name: `resume-builder-media`
5. Copy the `BLOB_READ_WRITE_TOKEN`
6. Add to environment variables and redeploy

---

### 4. Deploy to Vercel

**Method 1: Vercel Dashboard (Recommended for first time)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `pnpm build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `pnpm install` (auto-detected)

5. **Add Environment Variables** (click "Environment Variables"):

```bash
# Required - Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Required - Payload Secret (generate a random 32+ character string)
PAYLOAD_SECRET=your-super-secret-key-min-32-chars-long

# Required - Server URL (use your Vercel domain)
NEXT_PUBLIC_SERVER_URL=https://your-project.vercel.app

# Optional - Vercel Blob (only if you set up Blob storage)
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# Required - Cron Secret (generate random string)
CRON_SECRET=your-cron-secret-here

# Required - Preview Secret (generate random string)
PREVIEW_SECRET=your-preview-secret-here

# Optional - OpenAI (for AI resume generation)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Optional - Google OAuth (for Google Docs export feature)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=https://your-project.vercel.app/api/google/callback
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

6. Click **Deploy**
7. Wait 2-3 minutes for build to complete

**Method 2: Vercel CLI (Alternative)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

---

### 5. Configure Google OAuth (Optional - For Google Docs Export)

**Your codebase uses Google OAuth2 (not Service Account), so you can reuse your existing credentials!**

**Step 1: Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-project.vercel.app/api/google/callback
   ```
5. Click **Save**

**Step 2: Add to Vercel Environment Variables**

Use your existing Google OAuth credentials from local `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=https://your-project.vercel.app/api/google/callback
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

**Step 3: Authenticate After Deployment**

After your site is deployed:

1. Visit: `https://your-project.vercel.app/api/google/authorize`
2. Sign in with your Google account
3. Grant permissions (Drive and Docs access)
4. You'll be redirected back with success message
5. Tokens are stored and auto-refresh

**Why OAuth2 is Easier Than Service Account:**
- ✅ No need to modify your code (already implemented)
- ✅ Uses your personal Google Drive quota
- ✅ Simple one-time authorization flow
- ✅ Tokens auto-refresh when expired
- ✅ No JSON key file management

**Note:** The token file (`.google-token.json`) is stored in Vercel's ephemeral filesystem and will persist across function invocations but may need re-authorization after cold starts. This is normal for serverless environments.

---

### 6. Initialize Database

**After first deployment, you need to initialize the database:**

1. Go to your Vercel project dashboard
2. Click **Deployments** → Select your latest deployment
3. Click **View Function Logs**
4. The database tables should auto-create on first run

**If tables don't auto-create:**

```bash
# Option A: Run locally with production DATABASE_URL
DATABASE_URL="your-production-db-url" pnpm run init:db

# Option B: Use Vercel CLI
vercel env pull .env.production.local
pnpm run init:db
```

---

### 6. Seed Initial Data

**Access Payload Admin:**

1. Visit: `https://your-project.vercel.app/admin`
2. Create your first admin user:
   - Email: your-email@example.com
   - Password: Strong password (min 8 chars)

**Seed data via Admin UI:**

1. Go to **Settings** → **Database Management**
2. Click **Seed Complete Data** button
3. Wait for success message
4. Refresh the page

**Or seed via CLI:**

```bash
# Pull production environment variables
vercel env pull .env.production.local

# Run seed script
pnpm run seed:complete
```

---

### 7. Configure Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your domain: `yourname.com`
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SERVER_URL` environment variable:
   ```bash
   NEXT_PUBLIC_SERVER_URL=https://yourname.com
   ```
5. Redeploy (Vercel auto-redeploys on env var changes)

---

### 8. Set Up Automatic Deployments

**Vercel automatically deploys on Git push:**

- **Production:** Pushes to `main` branch → `your-project.vercel.app`
- **Preview:** Pull requests → `your-project-git-branch.vercel.app`

**Configure deployment settings:**

1. Go to **Settings** → **Git**
2. **Production Branch:** `main`
3. **Ignored Build Step:** Leave empty (build on every push)
4. **Auto-deploy:** Enabled (recommended)

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `PAYLOAD_SECRET` | JWT encryption secret (32+ chars) | `your-super-secret-key-here` |
| `NEXT_PUBLIC_SERVER_URL` | Your production URL | `https://your-project.vercel.app` |
| `CRON_SECRET` | Cron job authentication | `random-secret-string` |
| `PREVIEW_SECRET` | Preview mode authentication | `random-secret-string` |

### Optional Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Admin panel image uploads in production |
| `OPENAI_API_KEY` | OpenAI API key | AI resume generation |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | Google Docs export |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | Google Docs export |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Google Docs export |
| `GOOGLE_DRIVE_FOLDER_ID` | Target Google Drive folder ID | Google Docs export |

---

## Post-Deployment Checklist

- [ ] Visit `https://your-project.vercel.app` - Homepage loads
- [ ] Visit `https://your-project.vercel.app/admin` - Admin panel accessible
- [ ] Create admin user account
- [ ] Seed database with initial data
- [ ] Test project card display on homepage
- [ ] Test animated starfield background
- [ ] Visit `/projects` page - All projects display correctly
- [ ] Upload a test image - Vercel Blob storage working
- [ ] Test AI resume generation (if OpenAI key configured)
- [ ] Test Google Docs export (if configured)
- [ ] Check Vercel Function Logs for errors
- [ ] Set up custom domain (optional)
- [ ] Configure DNS records (if using custom domain)

---

## Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Solution: Make sure all dependencies are in package.json
pnpm install
git add package.json pnpm-lock.yaml
git commit -m "fix: update dependencies"
git push
```

**Error: "Build exceeded maximum duration"**
```bash
# Solution: Upgrade to Vercel Pro or optimize build
# Check Settings → General → Build & Development Settings
# Increase timeout or optimize dependencies
```

### Database Connection Issues

**Error: "Connection timeout"**
```bash
# Solution: Check DATABASE_URL format
# Must include ?sslmode=require for Neon
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

**Error: "Too many connections"**
```bash
# Solution: Use connection pooling
# Neon provides this automatically
# Or use Prisma connection pooling
```

### Blob Storage Issues

**Error: "Failed to upload image"**
```bash
# Solution: Verify BLOB_READ_WRITE_TOKEN
# Check Vercel dashboard → Storage → Blob → Settings
# Regenerate token if needed
```

### Cold Start Performance

**Issue: First request is slow (~2-3 seconds)**
```bash
# This is normal for serverless
# Solutions:
# 1. Upgrade to Vercel Pro (faster cold starts)
# 2. Use Vercel Edge Functions for critical paths
# 3. Implement ISR (Incremental Static Regeneration)
```

### Environment Variables Not Working

```bash
# Solution: Redeploy after changing env vars
# Vercel caches environment variables at build time
# Go to Deployments → Click "..." → Redeploy
```

---

## Performance Optimization

### Enable ISR (Incremental Static Regeneration)

Already configured in your Next.js app:
- Homepage: Revalidates every 60 seconds
- Projects page: Revalidates every 60 seconds
- Static pages: Built at deploy time

### Enable Edge Caching

```typescript
// In your page components
export const revalidate = 60 // Revalidate every 60 seconds
```

### Optimize Images

Vercel automatically optimizes images via Next.js Image component.
Make sure you're using `<Image>` from `next/image`.

---

## Monitoring & Logs

### View Function Logs

1. Vercel Dashboard → Your Project
2. Click **Deployments** → Select deployment
3. Click **View Function Logs**
4. Filter by function or search for errors

### Analytics (Vercel Pro)

- Real-time visitor analytics
- Core Web Vitals monitoring
- Performance insights

### Error Tracking

Consider integrating:
- Sentry (error tracking)
- LogRocket (session replay)
- Vercel Analytics (built-in)

---

## Scaling Considerations

### Free Tier Limits

- 100 GB bandwidth/month
- 6,000 build minutes/month
- 100 GB-hours serverless function execution
- Unlimited deployments

### When to Upgrade to Pro ($20/month)

- Need more bandwidth (1 TB/month)
- Faster build times
- Faster cold starts
- Team collaboration features
- Advanced analytics

---

## Security Best Practices

### Environment Variables

- ✅ Never commit `.env` files to Git
- ✅ Use Vercel's environment variable encryption
- ✅ Rotate secrets regularly (PAYLOAD_SECRET, CRON_SECRET)
- ✅ Use different secrets for preview vs production

### Database Security

- ✅ Use SSL/TLS connections (`?sslmode=require`)
- ✅ Restrict database access by IP (if possible)
- ✅ Use strong passwords (20+ characters)
- ✅ Enable connection pooling

### API Security

- ✅ CRON_SECRET for cron job authentication
- ✅ PREVIEW_SECRET for preview mode
- ✅ CORS configured in Payload config
- ✅ Rate limiting on API routes

---

## Backup Strategy

### Database Backups

**Neon (Automatic):**
- Point-in-time recovery (7 days on free tier)
- Automatic daily backups

**Manual Backup:**
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Media Backups

Vercel Blob doesn't have automatic backups. Consider:
- Periodic exports to S3
- Cloudflare R2 as alternative storage
- Manual download of critical assets

---

## Support Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Payload Docs:** [payloadcms.com/docs](https://payloadcms.com/docs)
- **Neon Docs:** [neon.tech/docs](https://neon.tech/docs)
- **Vercel Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

## Quick Reference Commands

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Link local project to Vercel
vercel link
```

---

## Next Steps After Deployment

1. ✅ Set up monitoring and alerts
2. ✅ Configure custom domain
3. ✅ Set up automated backups
4. ✅ Enable Vercel Analytics
5. ✅ Configure error tracking (Sentry)
6. ✅ Set up staging environment (use preview deployments)
7. ✅ Document deployment process for team
8. ✅ Set up CI/CD tests (already configured with GitHub Actions)

---

**Congratulations! Your Next.js + Payload CMS app is now live on Vercel! 🎉**
