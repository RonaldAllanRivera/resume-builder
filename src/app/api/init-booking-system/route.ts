import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/init-booking-system
 *
 * Initialize the booking system in production
 * This endpoint creates the necessary collections and seeds initial data
 *
 * This should be called once after deployment to set up the booking system
 * Also works with Vercel Cron Jobs for automatic initialization
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (optional security measure)
    const authHeader = request.headers.get('authorization')
    const initSecret = process.env.BOOKING_INIT_SECRET

    if (initSecret && (!authHeader || authHeader !== `Bearer ${initSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Check if packages collection exists by trying to query it
    try {
      await payload.find({
        collection: 'packages',
        depth: 0,
        limit: 1,
      })

      return NextResponse.json({
        message: 'Booking system already initialized',
        status: 'already_exists',
      })
    } catch (_error) {
      // Collection doesn't exist, proceed with initialization
    }

    // Create sample packages with minimal required fields
    const samplePackages = [
      {
        name: 'Consultation Call',
        slug: 'consultation-call',
        description: 'A 30-minute consultation call to discuss your project requirements.',
        shortDescription: '30-minute project consultation',
        price: 5000,
        currency: 'USD',
        duration: 30,
        durationUnit: 'minutes',
        active: true,
      },
      {
        name: 'Day Rate',
        slug: 'day-rate',
        description: 'Full day (8 hours) of dedicated development work.',
        shortDescription: 'Full day of development',
        price: 80000,
        currency: 'USD',
        duration: 8,
        durationUnit: 'hours',
        active: true,
      },
      {
        name: 'Week Rate',
        slug: 'week-rate',
        description: 'Full week (40 hours) of dedicated development work.',
        shortDescription: 'Full week of development',
        price: 350000,
        currency: 'USD',
        duration: 5,
        durationUnit: 'days',
        active: true,
      },
      {
        name: 'Monthly Retainer',
        slug: 'monthly-retainer',
        description: 'Monthly retainer for ongoing development and support.',
        shortDescription: 'Monthly development support',
        price: 600000,
        currency: 'USD',
        duration: 1,
        durationUnit: 'month',
        active: true,
      },
    ]

    const createdPackages = []

    // Create packages
    for (const pkg of samplePackages) {
      try {
        const result = await payload.create({
          collection: 'packages',
          data: pkg,
        })
        createdPackages.push(result.name)
        console.log(`Created package: ${pkg.name}`)
      } catch (error) {
        console.error(`Failed to create package ${pkg.name}:`, error)
      }
    }

    // Create default availability rules
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

    let availabilityCreated = false
    try {
      await payload.create({
        collection: 'availabilityRules',
        data: defaultAvailability,
      })
      availabilityCreated = true
      console.log('Created default availability rules')
    } catch (error) {
      console.error('Failed to create availability rules:', error)
    }

    return NextResponse.json({
      message: 'Booking system initialized successfully',
      status: 'success',
      packages: createdPackages,
      availability: availabilityCreated,
    })
  } catch (error) {
    console.error('Initialization failed:', error)
    return NextResponse.json(
      {
        error: 'Initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
