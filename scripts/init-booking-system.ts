import { getPayload } from 'payload'
import config from '@payload-config'
import type { Package } from '@/payload-types'

/**
 * Initialize booking system in production
 * This script creates the necessary collections and seeds initial data
 */

async function initializeBookingSystem() {
  console.log('Initializing booking system...')

  try {
    const payload = await getPayload({ config })

    // Check if packages collection exists by trying to query it
    try {
      await payload.find({
        collection: 'packages',
        depth: 0,
        limit: 1,
      })
      console.log('Booking system already initialized')
      return
    } catch (_error) {
      console.log('Booking system not found, initializing...')
    }

    // Create initial package data
    console.log('Creating sample packages...')

    const samplePackages = [
      {
        name: 'Consultation Call',
        slug: 'consultation-call',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'A 30-minute consultation call to discuss your project requirements and how I can help.',
                  },
                ],
              },
            ],
          },
        },
        shortDescription: '30-minute project consultation',
        price: 5000, // $50.00 in cents
        currency: 'USD',
        duration: 30,
        durationUnit: 'minutes',
        active: true,
        features: [
          '30-minute video call',
          'Project requirements analysis',
          'Technical recommendations',
          'Next steps roadmap',
        ],
      },
      {
        name: 'Day Rate',
        slug: 'day-rate',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Full day (8 hours) of dedicated development work on your project.',
                  },
                ],
              },
            ],
          },
        },
        shortDescription: 'Full day of development',
        price: 80000, // $800.00 in cents
        currency: 'USD',
        duration: 8,
        durationUnit: 'hours',
        active: true,
        features: [
          '8 hours of development',
          'Daily progress updates',
          'Code review and quality assurance',
          'Deployment assistance',
        ],
      },
      {
        name: 'Week Rate',
        slug: 'week-rate',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Full week (40 hours) of dedicated development work for larger projects.',
                  },
                ],
              },
            ],
          },
        },
        shortDescription: 'Full week of development',
        price: 350000, // $3,500.00 in cents
        currency: 'USD',
        duration: 5,
        durationUnit: 'days',
        active: true,
        features: [
          '40 hours of development',
          'Daily standup calls',
          'Weekly progress report',
          'Priority support',
          'Code review and testing',
          'Documentation',
        ],
      },
      {
        name: 'Monthly Retainer',
        slug: 'monthly-retainer',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Monthly retainer for ongoing development and support.',
                  },
                ],
              },
            ],
          },
        },
        shortDescription: 'Monthly development support',
        price: 600000, // $6,000.00 in cents
        currency: 'USD',
        duration: 1,
        durationUnit: 'month',
        active: true,
        features: [
          '80 hours per month',
          'Ongoing maintenance',
          'Feature development',
          'Bug fixes and support',
          'Monthly planning session',
          'Technical consultation',
        ],
      },
    ]

    // Create packages using Payload's API (this will create the collection if it doesn't exist)
    for (const pkg of samplePackages) {
      try {
        await payload.create({
          collection: 'packages',
          data: pkg,
        })
        console.log(`Created package: ${pkg.name}`)
      } catch (error) {
        console.error(`Failed to create package ${pkg.name}:`, error)
      }
    }

    // Create default availability rules
    console.log('Creating default availability rules...')

    const defaultAvailability = {
      name: 'Standard Business Hours',
      timezone: 'America/New_York',
      active: true,
      rules: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false },
        sunday: { enabled: false },
      },
    }

    try {
      await payload.create({
        collection: 'availabilityRules',
        data: defaultAvailability,
      })
      console.log('Created default availability rules')
    } catch (error) {
      console.error('Failed to create availability rules:', error)
    }

    console.log('Booking system initialization completed successfully!')
  } catch (error) {
    console.error('Initialization failed:', error)
    process.exit(1)
  }
}

// Run the initialization
initializeBookingSystem()
  .then(() => {
    console.log('Initialization completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Initialization failed:', error)
    process.exit(1)
  })
