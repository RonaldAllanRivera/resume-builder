import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Fetch published projects by category
 */
export async function getProjectsByCategory(category: string) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      and: [{ _status: { equals: 'published' } }, { category: { equals: category } }],
    },
    sort: '-publishedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })

  return docs
}

/**
 * Fetch all published projects
 */
export async function getAllProjects() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      _status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })

  return docs
}

/**
 * Fetch featured projects
 */
export async function getFeaturedProjects() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }],
    },
    sort: 'order',
    limit: 6,
    depth: 0,
    overrideAccess: false,
  })

  return docs
}

/**
 * Fetch latest non-featured project by category
 */
export async function getLatestProjectByCategory(category: string) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { category: { equals: category } },
        { featured: { not_equals: true } },
      ],
    },
    sort: '-publishedAt',
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })

  return docs[0] || null
}

/**
 * Fetch project by slug
 */
export async function getProjectBySlug(slug: string) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })

  return docs[0] || null
}

/**
 * Fetch all published certifications (chronological order)
 */
export async function getAllCertifications() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'certifications',
    where: {
      _status: { equals: 'published' },
    },
    sort: '-issueDate',
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })

  return docs
}

/**
 * Fetch all published experiences
 */
export async function getAllExperiences() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'experiences',
    where: {
      _status: { equals: 'published' },
    },
    sort: '-startDate',
    limit: 50,
    depth: 1,
    overrideAccess: false,
  })

  return docs
}

/**
 * Fetch all published educations
 */
export async function getAllEducations() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'educations',
    where: {
      _status: { equals: 'published' },
    },
    sort: '-startDate',
    limit: 50,
    depth: 0,
    overrideAccess: false,
  })

  return docs
}

/**
 * Fetch resume profile global
 */
export async function getResumeProfile() {
  const payload = await getPayload({ config })

  const profile = await payload.findGlobal({
    slug: 'resumeProfile',
    depth: 0,
  })

  return profile
}
