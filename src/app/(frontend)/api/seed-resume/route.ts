import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Admin-only API endpoint for seeding resume data
 * Useful for one-time seeding on Vercel or other serverless platforms
 * 
 * Usage: POST /api/seed-resume with admin authentication
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    // Verify user is admin
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if data already exists to prevent accidental re-seeding
    const existingCerts = await payload.find({
      collection: 'certifications',
      limit: 1,
      overrideAccess: true,
    })

    if (existingCerts.totalDocs > 0) {
      return NextResponse.json(
        {
          error: 'Database already seeded',
          message: 'Use reset:database first if you want to re-seed',
          existingRecords: existingCerts.totalDocs,
        },
        { status: 400 },
      )
    }

    // Import and run seed function
    const { seedResumeComplete } = await import('@/endpoints/seed-resume-complete')

    const req = {
      user,
      payload,
      headers: request.headers,
    } as any

    await seedResumeComplete({
      payload,
      req,
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Resume data seeded successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        error: 'Seed failed',
        message: error.message,
      },
      { status: 500 },
    )
  }
}

// GET endpoint to check seed status
export async function GET() {
  try {
    const payload = await getPayload({ config })

    const [certs, projects, experiences, educations] = await Promise.all([
      payload.find({ collection: 'certifications', limit: 1, overrideAccess: true }),
      payload.find({ collection: 'projects', limit: 1, overrideAccess: true }),
      payload.find({ collection: 'experiences', limit: 1, overrideAccess: true }),
      payload.find({ collection: 'educations', limit: 1, overrideAccess: true }),
    ])

    return NextResponse.json({
      seeded: certs.totalDocs > 0,
      counts: {
        certifications: certs.totalDocs,
        projects: projects.totalDocs,
        experiences: experiences.totalDocs,
        educations: educations.totalDocs,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
