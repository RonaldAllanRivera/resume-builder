#!/usr/bin/env tsx
/**
 * Seed database for E2E tests
 * Creates test user and minimal data needed for E2E tests
 */

import 'dotenv/config'
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

    // Resume Profile (global)
    await payload.updateGlobal({
      slug: 'resumeProfile',
      data: {
        fullName: 'Test User',
        headline: 'Test Developer',
        summary: 'Test summary for E2E tests',
      },
    })

    // Create Resume Profile (collection record for generations)
    console.log('Creating resume profile...')
    await payload.create({
      collection: 'resumeProfiles',
      data: {
        name: 'Test Resume Profile',
        resumeText: 'Test resume profile for E2E tests',
        notes: 'Created for E2E testing',
      },
    })

    // Create test projects
    console.log('Creating test projects...')
    await payload.create({
      collection: 'projects',
      data: {
        title: 'Test Project 1',
        slug: 'test-project-1',
        summary: 'Test project summary',
        category: 'full-stack',
        featured: true,
        _status: 'published',
      },
      draft: false,
    })

    await payload.create({
      collection: 'projects',
      data: {
        title: 'Test Project 2',
        slug: 'test-project-2',
        summary: 'Another test project',
        category: 'full-stack',
        featured: false,
        _status: 'published',
      },
      draft: false,
    })

    // Create test company
    console.log('Creating test company...')
    const company = await payload.create({
      collection: 'companies',
      data: {
        name: 'Test Company',
        website: 'https://test-company.com',
      },
    })

    // Create test job ad
    console.log('Creating test job ad...')
    await payload.create({
      collection: 'jobAds',
      data: {
        title: 'Test Job Position',
        company: company.id,
        jobDescription: 'Test job description for E2E tests',
        status: 'new',
      },
    })

    console.log('✓ Database seeded successfully for E2E tests')
    console.log(`  - 1 admin user`)
    console.log(`  - 1 resume profile`)
    console.log(`  - 2 projects`)
    console.log(`  - 1 company`)
    console.log(`  - 1 job ad`)
    process.exit(0)
  } catch (error) {
    console.error('✗ Failed to seed database:', error)
    process.exit(1)
  }
}

seedE2E()
