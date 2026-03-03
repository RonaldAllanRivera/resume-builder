import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Admin-only endpoint to reset (delete all) resume data
 * DELETE: experiences, projects, educations, certifications
 * PRESERVE: users, media, pages, posts, companies, jobAds, generations
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

    // Collections to reset (resume data only)
    const collections = ['experiences', 'projects', 'educations', 'certifications'] as const

    const deletedCounts: Record<string, number> = {}

    for (const collection of collections) {
      try {
        const docs = await payload.find({
          collection,
          limit: 1000,
          overrideAccess: true,
        })

        let deletedCount = 0
        for (const doc of docs.docs) {
          await payload.delete({
            collection,
            id: doc.id,
            overrideAccess: true,
          })
          deletedCount++
        }

        deletedCounts[collection] = deletedCount
      } catch (error: unknown) {
        console.error(`Error deleting from ${collection}:`, error)
        deletedCounts[collection] = 0
      }
    }

    // Reset Resume Profile global
    try {
      await payload.updateGlobal({
        slug: 'resumeProfile',
        data: {
          fullName: '',
          headline: '',
          summary: '',
          email: '',
          publishEmail: false,
          phone: '',
          publishPhone: false,
          address: '',
          publishAddress: false,
          dateOfBirth: '',
          publishDateOfBirth: false,
        },
      })
      deletedCounts['resumeProfile'] = 1
    } catch (error: unknown) {
      console.error('Error resetting Resume Profile:', error)
      deletedCounts['resumeProfile'] = 0
    }

    const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      message: `Database reset complete. Deleted ${totalDeleted} records and reset Resume Profile.`,
      deleted: deletedCounts,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Reset error:', error)
    return NextResponse.json(
      {
        error: 'Reset failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
