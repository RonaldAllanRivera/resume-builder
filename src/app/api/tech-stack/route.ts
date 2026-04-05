import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Fetch all published projects (same as Hero component)
    const projectResults = await payload.find({
      collection: 'projects',
      limit: 100,
      where: {
        _status: { equals: 'published' },
      },
    })

    // Extract tech stack from projects (same logic as Hero component)
    const techStackCount = new Map<string, number>()

    projectResults.docs.forEach((project: any) => {
      if (project.techStack && Array.isArray(project.techStack)) {
        project.techStack.forEach((tech: any) => {
          if (tech && typeof tech === 'object' && tech.name && tech.name.trim()) {
            const techName = tech.name.trim()
            techStackCount.set(techName, (techStackCount.get(techName) || 0) + 1)
          }
        })
      }
    })

    // Sort by count (descending), then alphabetically for ties, limit to top 8
    const sortedTechStacks = Array.from(techStackCount.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1] // Sort by count descending
        return a[0].localeCompare(b[0]) // Sort alphabetically for same count
      })
      .slice(0, 8) // Limit to top 8 most used tech stacks
      .map(([tech]) => tech)

    return NextResponse.json({ techStacks: sortedTechStacks })
  } catch (error) {
    console.error('Error fetching tech stack:', error)
    // Return fallback tech stack
    return NextResponse.json({
      techStacks: [
        'React',
        'Next.js',
        'Laravel',
        'WordPress',
        'Python',
        'AI',
        'TypeScript',
        'Node.js',
      ],
    })
  }
}
