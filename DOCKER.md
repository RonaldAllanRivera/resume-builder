# Docker Development Guide

## Quick Start (Fast Testing)

```bash
# Start everything (first time will install dependencies)
docker compose up

# Or start in background and follow logs
docker compose up -d && docker compose logs -f app
```

Visit `http://localhost:3000` once you see "Ready in XXXXms" in the logs.

## Essential Commands

```bash
# Start services
docker compose up          # Foreground (see logs immediately)
docker compose up -d       # Background (daemon mode)

# View logs
docker compose logs -f app      # Follow app logs (hot reload visible here)
docker compose logs -f postgres # Follow database logs

# Stop services
docker compose down        # Stop all services
docker compose down -v     # Stop and delete all data (⚠️ WARNING: deletes database)

# Restart (after code changes that need full restart)
docker compose restart app

# Open shell in container
docker compose exec app sh
```

## Common Tasks

### Install new dependencies
```bash
docker compose exec app pnpm add <package-name>
```

### Run Payload commands
```bash
docker compose exec app pnpm run generate:types
docker compose exec app pnpm run generate:importmap
docker compose exec app pnpm run seed:resume
```

### Database access
```bash
docker compose exec postgres psql -U postgres -d payload
```

### Troubleshooting

**Port 3000 already in use:**
```bash
# Stop local dev server first
# Then start Docker
docker compose up
```

**Dependencies not installing:**
```bash
# Clear node_modules volume and rebuild
docker compose down -v
docker compose up --build
```

**Database connection issues:**
```bash
# Check database health
docker compose ps

# View database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

**Hot reload not working:**
- The compose file sets `WATCHPACK_POLLING=true` for file watching in Docker
- If still not working, try restarting: `docker compose restart app`

**Clean slate (nuclear option):**
```bash
# ⚠️ WARNING: This deletes ALL data including database
docker compose down -v
docker volume rm resume-builder-postgres-data resume-builder-node-modules resume-builder-pnpm-store
docker compose up
```

## Architecture

- **app** service: Next.js dev server with hot reload
  - Mounts source code for live editing
  - Uses named volume for `node_modules` (platform-independent)
  - Caches pnpm store for faster rebuilds
  
- **postgres** service: PostgreSQL 16
  - Data persisted in named volume
  - Health checks ensure app waits for DB to be ready

## Environment Variables

The `.env` file is automatically loaded into the app container via `env_file` in docker-compose.yml.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Secret key for Payload CMS
- `NEXT_PUBLIC_SERVER_URL` - Public URL for the site

See `.env.example` for all available options.

## Production Deployment

This docker-compose.yml is for **development only**. For production:

1. Use the `Dockerfile` (multi-stage build with standalone output)
2. Set `output: 'standalone'` in `next.config.js`
3. Build: `docker build -t resume-builder .`
4. Run: `docker run -p 3000:3000 --env-file .env.production resume-builder`

Or deploy to a platform like Vercel, Railway, or Render.
