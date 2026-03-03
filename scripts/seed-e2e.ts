#!/usr/bin/env tsx
/**
 * Seed database for E2E tests
 * Creates test user and minimal data needed for E2E tests
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'

async function seedE2E() {
  console.log('Seeding database for E2E tests...')

  try {
    const payload = await getPayload({ config })

    // Create test admin user
    console.log('Creating test admin user...')
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: 'dev@payloadcms.com',
        },
      },
    })

    if (existingUser.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'dev@payloadcms.com',
          password: 'test',
          roles: ['admin'],
        },
      })
      console.log('✓ Test admin user created')
    } else {
      console.log('✓ Test admin user already exists')
    }

    // Seed minimal resume data for tests
    console.log('Seeding minimal resume data...')

    // Site Settings
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        siteName: 'Test Resume Builder',
      },
    })

    // Resume Profile
    await payload.updateGlobal({
      slug: 'resumeProfile',
      data: {
        fullName: 'Test User',
        headline: 'Test Developer',
        summary: 'Test summary for E2E tests',
      },
    })

    console.log('✓ Database seeded successfully for E2E tests')
    process.exit(0)
  } catch (error) {
    console.error('✗ Failed to seed database:', error)
    process.exit(1)
  }
}

seedE2E()
