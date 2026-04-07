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
  
  # Step 1: Initialize database schema
  echo "🔧 Step 1: Initializing database schema..."
  if NODE_OPTIONS='--no-deprecation' pnpm tsx scripts/init-db.ts; then
    echo "✅ Database initialized successfully"
  else
    echo "⚠️ Database init had issues, but continuing..."
  fi
  
  # Step 2: Check migration status
  echo "🔧 Step 2: Checking migration status..."
  pnpm migrate:status 2>/dev/null || echo "⚠️ Could not check migration status"
  
  # Step 3: Run migrations
  echo "🔧 Step 3: Running migrations..."
  if pnpm migrate 2>/dev/null; then
    echo "✅ Migrations completed successfully"
  else
    echo "⚠️ Migrations had issues, continuing with build..."
  fi
else
  echo "📋 Skipping migrations (no DATABASE_URL or not in Vercel environment)"
fi

echo "🏗️ Building Next.js application..."
NODE_OPTIONS='--no-deprecation --max-old-space-size=4096' pnpm exec next build

echo "✅ Build completed successfully!"
