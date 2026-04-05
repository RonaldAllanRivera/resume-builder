import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  extractKeywords,
  formatExperienceResult,
  formatProjectResult,
  formatCertificationResult,
  type SearchResponse,
  type SearchFilters,
} from '@/utilities/search'

// Rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (record && now > record.resetTime) {
    rateLimitStore.delete(ip)
  }

  const current = rateLimitStore.get(ip)

  if (!current) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }

  current.count++
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = (searchParams.get('type') as SearchFilters['type']) || 'all'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Extract keywords from query
    const keywords = extractKeywords(query)

    // Initialize Payload
    const payload = await getPayload({ config })

    // Search experiences
    let experiences: any[] = []
    if (type === 'all' || type === 'experience') {
      const expResults = await payload.find({
        collection: 'experiences',
        limit: 100,
        where: {
          _status: { equals: 'published' },
        },
      })

      // Format and filter by relevance (search all fields including highlights)
      experiences = expResults.docs
        .map((exp) => formatExperienceResult(exp, keywords))
        .filter((result) => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        // Remove duplicates based on title + subtitle + date
        .filter(
          (result, index, self) =>
            index ===
            self.findIndex(
              (r) =>
                r.title === result.title &&
                r.subtitle === result.subtitle &&
                r.date === result.date,
            ),
        )
        .slice(0, limit)
    }

    // Search projects
    let projects: any[] = []
    if (type === 'all' || type === 'projects') {
      const projResults = await payload.find({
        collection: 'projects',
        limit: 100,
        where: {
          _status: { equals: 'published' },
        },
      })

      // Format and filter by relevance (search all fields including techStack and category)
      projects = projResults.docs
        .map((proj) => formatProjectResult(proj, keywords))
        .filter((result) => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        // Remove duplicates based on title + subtitle
        .filter(
          (result, index, self) =>
            index ===
            self.findIndex((r) => r.title === result.title && r.subtitle === result.subtitle),
        )
        .slice(0, limit)
    }

    // Search certifications
    let certifications: any[] = []
    if (type === 'all' || type === 'certifications') {
      const certResults = await payload.find({
        collection: 'certifications',
        limit: 100,
        where: {
          _status: { equals: 'published' },
        },
      })

      // Format and filter by relevance (search all fields including category)
      certifications = certResults.docs
        .map((cert) => formatCertificationResult(cert, keywords))
        .filter((result) => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        // Remove duplicates based on title + subtitle + date
        .filter(
          (result, index, self) =>
            index ===
            self.findIndex(
              (r) =>
                r.title === result.title &&
                r.subtitle === result.subtitle &&
                r.date === result.date,
            ),
        )
        .slice(0, limit)
    }

    // Build response
    const response: SearchResponse = {
      query,
      totalResults: experiences.length + projects.length + certifications.length,
      results: {
        experiences,
        projects,
        certifications,
      },
      counts: {
        experiences: experiences.length,
        projects: projects.length,
        certifications: certifications.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[SEARCH API ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
