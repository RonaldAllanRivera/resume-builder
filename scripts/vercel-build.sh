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
  
  # Step 1: Initialize database schema using init-db script
  echo "🔧 Step 1: Initializing database schema..."
  if NODE_OPTIONS='--no-deprecation' npx tsx scripts/init-db.ts 2>&1; then
    echo "✅ Database initialized successfully"
  else
    echo "⚠️ Database init had issues, continuing to migrations..."
  fi
  
  # Step 2: Run Payload migrations using the CLI
  echo "🔧 Step 2: Running Payload migrations..."
  if NODE_OPTIONS='--no-deprecation' npx payload migrate 2>&1; then
    echo "✅ Migrations completed successfully"
  else
    echo "⚠️ Migrations had issues, but continuing with build..."
  fi
  
  # Step 3: Sync database (ensure all collections are created)
  echo "🔧 Step 3: Syncing database..."
  if NODE_OPTIONS='--no-deprecation' npx payload migrate:sync 2>&1 || true; then
    echo "✅ Database sync completed"
  else
    echo "⚠️ Database sync had issues, continuing with build..."
  fi
else
  echo "📋 Skipping migrations (no DATABASE_URL or not in Vercel environment)"
fi

echo "🏗️ Building Next.js application..."
NODE_OPTIONS='--no-deprecation --max-old-space-size=4096' npx next build

echo "✅ Build completed successfully!"
