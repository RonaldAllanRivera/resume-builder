import { getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * POST /api/seed-booking
 * Admin-only endpoint to seed booking system data (packages + availability rules).
 *
 * GET /api/seed-booking
 * Check current booking seed status.
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })

    // Verify user is admin
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Login required' }, { status: 401 })
    }

    const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const req = {
      user,
      payload,
      headers: request.headers,
    } as PayloadRequest

    const { seedBookingData } = await import('@/endpoints/seed-booking')

    const result = await seedBookingData({ payload, req })

    return NextResponse.json({
      success: true,
      message: 'Booking data seeded successfully!',
      created: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Booking seed error:', error)
    return NextResponse.json(
      {
        error: 'Seed failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const [packages, rules] = await Promise.all([
      payload.find({ collection: 'packages', limit: 0, overrideAccess: true }),
      payload.find({ collection: 'availabilityRules', limit: 0, overrideAccess: true }),
    ])

    return NextResponse.json({
      seeded: packages.totalDocs > 0 && rules.totalDocs > 0,
      counts: {
        packages: packages.totalDocs,
        availabilityRules: rules.totalDocs,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
