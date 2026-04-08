import type { Payload, PayloadRequest } from 'payload'

/**
 * Seed sample packages and availability rules for the booking system.
 * Idempotent: checks for existing data before creating.
 */
export const seedBookingData = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<{ packages: number; availabilityRules: number }> => {
  payload.logger.info('Starting booking system seed...')

  // ── Seed Packages ──────────────────────────────────────────────────────
  const { totalDocs: existingPackages } = await payload.find({
    collection: 'packages',
    limit: 0,
    req,
  })

  let packagesCreated = 0

  if (existingPackages === 0) {
    payload.logger.info('— Seeding packages...')

    const packagesData = [
      {
        name: '30-Minute Consultation',
        slug: '30min-consultation',
        shortDescription: 'Initial project discussion and requirements gathering',
        price: 2500,
        currency: 'USD',
        durationType: 'call' as const,
        durationMinutes: 30,
        deliverables: [
          { item: 'Project requirements analysis' },
          { item: 'Technical recommendations' },
          { item: 'Timeline estimation' },
          { item: 'Next steps roadmap' },
        ],
        limits: [{ type: 'Follow-up', value: '1 email within 48 hours' }],
        requiresScheduling: true,
        active: true,
        sortOrder: 1,
      },
      {
        name: 'Day Rate',
        slug: 'day-rate',
        shortDescription: 'Full day of focused development work on your project',
        price: 20000,
        currency: 'USD',
        durationType: 'day' as const,
        deliverables: [
          { item: '8 hours of dedicated development' },
          { item: 'Daily progress update' },
          { item: 'Code review and documentation' },
          { item: 'Deployment to staging' },
        ],
        limits: [
          { type: 'Revisions', value: '2 rounds included' },
          { type: 'Response time', value: 'Same business day' },
          { type: 'Meetings', value: '1 check-in call' },
        ],
        requiresScheduling: true,
        active: true,
        sortOrder: 2,
      },
      {
        name: 'Week Rate',
        slug: 'week-rate',
        shortDescription: 'One week of dedicated development for medium-sized features',
        price: 100000,
        currency: 'USD',
        durationType: 'week' as const,
        deliverables: [
          { item: '40 hours of dedicated development' },
          { item: 'Daily standup updates' },
          { item: 'Feature implementation and testing' },
          { item: 'Code review and documentation' },
          { item: 'Deployment to staging and production' },
        ],
        limits: [
          { type: 'Revisions', value: '3 rounds included' },
          { type: 'Response time', value: 'Within 4 hours' },
          { type: 'Meetings', value: 'Daily 15-min standup' },
        ],
        requiresScheduling: true,
        active: true,
        sortOrder: 3,
      },
      {
        name: 'Monthly Retainer',
        slug: 'monthly-retainer',
        shortDescription: 'Ongoing development partnership for large-scale projects',
        price: 400000,
        currency: 'USD',
        durationType: 'month' as const,
        deliverables: [
          { item: 'Up to 160 hours of development' },
          { item: 'Architecture planning and design' },
          { item: 'Full-stack development' },
          { item: 'Performance optimization' },
          { item: 'Security audits and fixes' },
          { item: 'Production deployment and monitoring' },
          { item: 'Priority support' },
        ],
        limits: [
          { type: 'Revisions', value: 'Unlimited' },
          { type: 'Response time', value: 'Within 2 hours' },
          { type: 'Meetings', value: 'Weekly 30-min sync + ad-hoc' },
        ],
        requiresScheduling: true,
        active: false,
        sortOrder: 4,
      },
    ]

    for (const pkg of packagesData) {
      await payload.create({
        collection: 'packages',
        data: pkg,
        req,
      })
      packagesCreated++
    }

    payload.logger.info(`— Created ${packagesCreated} packages`)
  } else {
    payload.logger.info(`— Skipping packages (${existingPackages} already exist)`)
  }

  // ── Seed Availability Rules ────────────────────────────────────────────
  const { totalDocs: existingRules } = await payload.find({
    collection: 'availabilityRules',
    limit: 0,
    req,
  })

  let rulesCreated = 0

  if (existingRules === 0) {
    payload.logger.info('— Seeding availability rules...')

    // Evening availability (Mon-Fri after full-time job)
    await payload.create({
      collection: 'availabilityRules',
      data: {
        name: 'Weekday Evenings',
        timezone: 'Asia/Manila',
        daysOfWeek: ['1', '2', '3', '4', '5'],
        startTime: '18:00',
        endTime: '22:00',
        slotDurationMinutes: 30,
        bufferMinutes: 15,
        advanceNoticeDays: 7,
        maxAdvanceDays: 60,
        confirmationWindowHours: 24,
        maxBookingsPerDay: 3,
        active: true,
      },
      req,
    })
    rulesCreated++

    // Weekend availability (full day)
    await payload.create({
      collection: 'availabilityRules',
      data: {
        name: 'Weekend Full Day',
        timezone: 'Asia/Manila',
        daysOfWeek: ['6', '7'],
        startTime: '09:00',
        endTime: '18:00',
        slotDurationMinutes: 30,
        bufferMinutes: 15,
        advanceNoticeDays: 7,
        maxAdvanceDays: 60,
        confirmationWindowHours: 24,
        maxBookingsPerDay: 8,
        active: true,
      },
      req,
    })
    rulesCreated++

    payload.logger.info(`— Created ${rulesCreated} availability rules`)
  } else {
    payload.logger.info(`— Skipping availability rules (${existingRules} already exist)`)
  }

  payload.logger.info('Booking system seed complete!')

  return { packages: packagesCreated, availabilityRules: rulesCreated }
}
