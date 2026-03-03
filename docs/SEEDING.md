# Resume Data Seeding Guide

Complete guide for seeding your resume data locally, on Docker, and on Vercel.

## Quick Start

### Local Development
```bash
# Reset database (optional)
pnpm run reset:database

# Seed all resume data
pnpm run seed:resume
```

### Docker
```bash
# Reset and reseed
docker compose exec app sh -c "pnpm run reset:database && pnpm run seed:resume"

# Or just seed
docker compose exec app pnpm run seed:resume
```

## Seeding Options

### Option 1: Local CLI (Recommended for Development)

**Best for:** Local development, testing, Docker environments

```bash
pnpm run seed:resume
```

**What it seeds:**
- ✅ 65+ Certifications (LinkedIn Learning courses)
- ✅ 15 Projects (GitHub repos and live sites)
- ✅ 9 Work Experiences (20+ years of history)
- ✅ 1 Education (BS Computer Engineering)

**Pros:**
- Fast and reliable
- Full control over timing
- Easy to debug
- Works with Docker

**Cons:**
- Requires local/Docker access
- Can't run directly on Vercel

---

### Option 2: Admin API Endpoint (Best for Vercel)

**Best for:** One-time seeding on Vercel or production

**Step 1:** Deploy your app to Vercel

**Step 2:** Create an admin user via the UI
- Visit `https://your-app.vercel.app/admin/create-first-user`
- Create your admin account

**Step 3:** Get your auth token
```bash
# Login via API to get JWT token
curl -X POST https://your-app.vercel.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

**Step 4:** Seed via API
```bash
# Use the token from step 3
curl -X POST https://your-app.vercel.app/api/seed-resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check seed status:**
```bash
curl https://your-app.vercel.app/api/seed-resume
```

**Pros:**
- Works on Vercel
- Admin-protected
- Prevents accidental re-seeding
- Can be triggered remotely

**Cons:**
- Requires manual token retrieval
- Limited by serverless timeout (60s on Pro)

---

### Option 3: GitHub Actions (Best for CI/CD)

**Best for:** Automated seeding on deployment

Create `.github/workflows/seed-on-deploy.yml`:

```yaml
name: Seed Database on Deploy

on:
  workflow_dispatch: # Manual trigger
  deployment_status:

jobs:
  seed:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Seed database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}
        run: pnpm run seed:resume
```

**Pros:**
- Fully automated
- Runs on deployment
- No timeout issues
- Repeatable

**Cons:**
- Requires GitHub Actions setup
- Needs database connection from CI

---

## Vercel Deployment Considerations

### Database Options

**Option A: Vercel Postgres (Recommended)**
```bash
# In Vercel dashboard, add Vercel Postgres
# Copy connection string to environment variables
DATABASE_URL=postgres://...
```

**Option B: External Postgres (Neon, Supabase, Railway)**
```bash
# Use any Postgres provider
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Vercel Limitations

| Plan | Function Timeout | Best Approach |
|------|-----------------|---------------|
| Hobby | 10 seconds | ❌ Too short - Use GitHub Actions or seed locally before deploy |
| Pro | 60 seconds | ⚠️ Might work - Seed via API endpoint |
| Enterprise | 900 seconds | ✅ Works - Any method |

**Recommendation for Hobby/Pro:**
1. Seed database locally or via CI/CD
2. Deploy to Vercel with pre-seeded database
3. Use API endpoint only for small updates

---

## Data Management

### Reset Database
```bash
# Local
pnpm run reset:database

# Docker
docker compose exec app pnpm run reset:database

# Complete Docker reset (⚠️ deletes everything)
docker compose down -v
```

### Partial Seeding

Edit `src/endpoints/seed-resume-complete.ts` to comment out sections you don't want:

```typescript
// Skip certifications
// for (const cert of certifications) { ... }

// Only seed projects
for (const project of projects) {
  await payload.create({ ... })
}
```

### Update Existing Data

To update resume data without re-seeding:
1. Use the admin panel at `/admin`
2. Edit records directly
3. Or create a custom update script

---

## Best Practices

### ✅ Do
- Seed locally before deploying to production
- Use version control for seed data
- Test seed scripts in Docker first
- Keep seed data in sync with resume.txt
- Use admin API endpoint for one-time production seeding

### ❌ Don't
- Run seed multiple times (creates duplicates)
- Seed directly on Vercel Hobby (will timeout)
- Hardcode sensitive data in seed files
- Skip testing seed scripts locally

---

## Troubleshooting

### "Database already seeded" error
```bash
# Reset first, then reseed
pnpm run reset:database && pnpm run seed:resume
```

### Timeout on Vercel
```bash
# Seed locally, then deploy
pnpm run seed:resume
git push # Deploy to Vercel
```

### Connection errors
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
docker compose exec app pnpm payload run scripts/check-users.ts
```

### Duplicate records
```bash
# Reset and start fresh
pnpm run reset:database
pnpm run seed:resume
```

---

## Summary

**For local development:**
```bash
pnpm run seed:resume
```

**For Docker:**
```bash
docker compose exec app pnpm run seed:resume
```

**For Vercel (one-time):**
1. Deploy app
2. Create admin user
3. Call `/api/seed-resume` with admin token

**For production (best practice):**
1. Seed locally with production DATABASE_URL
2. Deploy to Vercel
3. Database is already populated
