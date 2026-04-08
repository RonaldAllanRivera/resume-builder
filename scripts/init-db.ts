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
    const collections = Object.keys(payload.collections)
    console.log(`✓ Payload initialized with ${collections.length} collections`)
    console.log(`  Collections: ${collections.join(', ')}`)

    // Try to query the packages collection to trigger table creation
    try {
      console.log('→ Checking packages collection...')
      await payload.find({
        collection: 'packages',
        limit: 1,
        depth: 0,
      })
      console.log('✓ Packages collection is accessible')
    } catch (e) {
      console.log(
        '⚠ Packages collection may need migration:',
        e instanceof Error ? e.message : String(e),
      )
    }

    // Try to query the pages collection
    try {
      console.log('→ Checking pages collection...')
      await payload.find({
        collection: 'pages',
        limit: 1,
        depth: 0,
      })
      console.log('✓ Pages collection is accessible')
    } catch (e) {
      console.log(
        '⚠ Pages collection may need migration:',
        e instanceof Error ? e.message : String(e),
      )
    }

    console.log('✓ Database initialization complete')
    process.exit(0)
  } catch (error) {
    console.error('✗ Failed to initialize database:', error)
    process.exit(1)
  }
}

initDatabase()
