import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

/**
 * Initialize booking system using the same pattern as other seed scripts
 */
const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  const req = await createLocalReq(
    {
      req: {
        headers: new Headers(),
      },
    },
    payload,
  )

  try {
    // Check if packages collection exists by trying to query it
    await payload.find({
      collection: 'packages',
      depth: 0,
      limit: 1,
    })
    
    console.log('Booking system already initialized')
    await payload.destroy()
    return
  } catch (_error) {
    console.log('Booking system not found, initializing...')
  }

  // Create sample packages
  console.log('Creating sample packages...')
  
  const packages = [
    {
      name: 'Consultation Call',
      slug: 'consultation-call',
      description: [
        {
          children: [
            { text: 'A 30-minute consultation call to discuss your project requirements and how I can help.' }
          ],
          type: 'paragraph'
        }
      ],
      shortDescription: '30-minute project consultation',
      price: 5000,
      currency: 'USD',
      duration: 30,
      durationUnit: 'minutes',
      active: true
    },
    {
      name: 'Day Rate',
      slug: 'day-rate',
      description: [
        {
          children: [
            { text: 'Full day (8 hours) of dedicated development work on your project.' }
          ],
          type: 'paragraph'
        }
      ],
      shortDescription: 'Full day of development',
      price: 80000,
      currency: 'USD',
      duration: 8,
      durationUnit: 'hours',
      active: true
    },
    {
      name: 'Week Rate',
      slug: 'week-rate',
      description: [
        {
          children: [
            { text: 'Full week (40 hours) of dedicated development work for larger projects.' }
          ],
          type: 'paragraph'
        }
      ],
      shortDescription: 'Full week of development',
      price: 350000,
      currency: 'USD',
      duration: 5,
      durationUnit: 'days',
      active: true
    },
    {
      name: 'Monthly Retainer',
      slug: 'monthly-retainer',
      description: [
        {
          children: [
            { text: 'Monthly retainer for ongoing development and support.' }
          ],
          type: 'paragraph'
        }
      ],
      shortDescription: 'Monthly development support',
      price: 600000,
      currency: 'USD',
      duration: 1,
      durationUnit: 'month',
      active: true
    }
  ]

  // Create packages
  for (const pkg of packages) {
    try {
      await payload.create({
        collection: 'packages',
        data: pkg,
        req,
        overrideAccess: true,
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
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
    bufferTimeMinutes: 15,
    maxBookingsPerDay: 8,
    rules: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false },
      sunday: { enabled: false }
    }
  }
  
  try {
    await payload.create({
      collection: 'availabilityRules',
      data: defaultAvailability,
      req,
      overrideAccess: true,
    })
    console.log('Created default availability rules')
  } catch (error) {
    console.error('Failed to create availability rules:', error)
  }

  console.log('Booking system initialization completed!')
  await payload.destroy()
}

await run()
