#!/usr/bin/env tsx
/**
 * Initialize Payload database schema
 * This creates all tables needed by Payload CMS
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'

async function initDatabase() {
  console.log('Initializing Payload database schema...')

  try {
    const payload = await getPayload({ config })
    console.log(
      `✓ Database schema initialized successfully (${payload.collections.length} collections)`,
    )
    process.exit(0)
  } catch (error) {
    console.error('✗ Failed to initialize database:', error)
    process.exit(1)
  }
}

initDatabase()
