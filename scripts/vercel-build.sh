#!/bin/bash
# Vercel Build Script with Database Migration
# This script runs database migrations before building the Next.js app

set -e

echo "🚀 Starting Vercel build process..."
echo "📋 Environment: $VERCEL_ENV"
echo "📋 Node Environment: $NODE_ENV"

# Check if we're in production/preview and have a database URL
if [ -n "$DATABASE_URL" ] && [ -n "$VERCEL_ENV" ]; then
  echo "📊 Database URL found, running migrations..."
  echo "🔗 Using database: ${DATABASE_URL%%@*}...@..." # Hide credentials
  
  # Migrations must succeed or the build fails. Previously this step was
  # wrapped in `if ...; else echo "continuing"`, which swallowed every failure
  # and let deploys go green against an unmigrated database — that is how
  # /admin ended up 500ing on a missing payment_proofs_id column.
  #
  # scripts/init-db.ts used to run here as "Step 1: Initializing database
  # schema". It never created anything: it only calls getPayload() and two
  # find() queries, and Payload disables schema push when NODE_ENV=production.
  # Migrations are the only thing that changes the schema, so it is gone.
  # Without this, migrate() blocks on a TTY-less confirm and exits 0 having done
  # nothing. See the script's header for the full explanation.
  echo "🔧 Clearing any dev-push migration marker..."
  NODE_OPTIONS='--no-deprecation' npx tsx scripts/clear-dev-migration-marker.ts

  echo "🔧 Running Payload migrations..."
  NODE_OPTIONS='--no-deprecation' npx payload migrate
  echo "✅ Migrations completed successfully"
else
  echo "📋 Skipping migrations (no DATABASE_URL or not in Vercel environment)"
fi

echo "🏗️ Building Next.js application..."
NODE_OPTIONS='--no-deprecation --max-old-space-size=4096' npx next build

echo "✅ Build completed successfully!"
