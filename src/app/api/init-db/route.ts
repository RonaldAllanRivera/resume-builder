import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

/**
 * Database initialization endpoint
 * This can be called manually to initialize the Payload schema
 * Protected by CRON_SECRET for security
 */
export async function POST(req: Request) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || process.env.PAYLOAD_SECRET
    
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Server not configured for DB initialization' },
        { status: 500 }
      )
    }
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize Payload (this creates the schema if it doesn't exist)
    console.log('Initializing Payload database...')
    const payload = await getPayload({ config })
    
    // Get collection info
    const collections = Object.keys(payload.collections)
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      collections: collections.length,
      collectionNames: collections,
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Use POST with Bearer token to initialize database'
  })
}
