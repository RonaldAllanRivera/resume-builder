import { getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * POST /api/reset-booking
 * Admin-only endpoint to delete all booking system data (packages, customers, availability rules, bookings).
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

    let deletedCount = 0

    // Delete all bookings first (has foreign keys)
    const { docs: bookings } = await payload.find({
      collection: 'bookings',
      limit: 1000,
      req,
    })

    for (const booking of bookings) {
      await payload.delete({
        collection: 'bookings',
        id: booking.id,
        req,
      })
      deletedCount++
    }

    // Delete all customers
    const { docs: customers } = await payload.find({
      collection: 'customers',
      limit: 1000,
      req,
    })

    for (const customer of customers) {
      await payload.delete({
        collection: 'customers',
        id: customer.id,
        req,
      })
      deletedCount++
    }

    // Delete all packages
    const { docs: packages } = await payload.find({
      collection: 'packages',
      limit: 1000,
      req,
    })

    for (const pkg of packages) {
      await payload.delete({
        collection: 'packages',
        id: pkg.id,
        req,
      })
      deletedCount++
    }

    // Delete all availability rules
    const { docs: rules } = await payload.find({
      collection: 'availabilityRules',
      limit: 1000,
      req,
    })

    for (const rule of rules) {
      await payload.delete({
        collection: 'availabilityRules',
        id: rule.id,
        req,
      })
      deletedCount++
    }

    return NextResponse.json({
      success: true,
      message: 'Booking data reset successfully!',
      deletedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Reset booking error:', error)
    return NextResponse.json(
      {
        error: 'Reset failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
