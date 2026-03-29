import { getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { seedResumeComplete } from '@/endpoints/seed-resume-complete'

/**
 * Admin-only endpoint to seed resume data
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

    // Create request object for seed function
    const req = {
      user,
      payload,
      headers: request.headers,
    } as PayloadRequest

    // First, delete all existing projects
    const { docs: existingProjects } = await payload.find({
      collection: 'projects',
      limit: 1000,
    })

    for (const project of existingProjects) {
      await payload.delete({
        collection: 'projects',
        id: project.id,
        req,
      })
    }

    // Seed everything (experiences, education, projects, certifications, globals)
    await seedResumeComplete({
      payload,
      req,
      overrideAccess: true,
      skipProjects: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Resume data seeded successfully!',
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        error: 'Seed failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
