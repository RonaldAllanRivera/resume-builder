import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'
import { seedResumeComplete } from '../../src/endpoints/seed-resume-complete'

describe('Seed Resume Complete', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }
  })

  it('should seed site settings global', async () => {
    const req = {
      payload,
      user: null,
      headers: new Headers(),
    } as any

    await seedResumeComplete({ payload, req, overrideAccess: true })

    const siteSettings = await payload.findGlobal({
      slug: 'siteSettings',
    })

    expect(siteSettings.siteName).toBe('Ronald Allan Rivera - Resume Builder')
    expect(siteSettings.socialLinks).toHaveLength(4)
    expect(siteSettings.socialLinks?.[0]?.label).toBe('Portfolio')
    expect(siteSettings.socialLinks?.[0]?.url).toBe('https://allanwebdesign.com')
  })

  it('should seed resume profile global', async () => {
    const resumeProfile = await payload.findGlobal({
      slug: 'resumeProfile',
    })

    expect(resumeProfile.fullName).toBe('Ronald Allan Rivera')
    expect(resumeProfile.email).toBe('jaeron.rivera@gmail.com')
    expect(resumeProfile.publishEmail).toBe(true)
  })

  it('should seed 9 experiences', async () => {
    const experiences = await payload.find({
      collection: 'experiences',
      limit: 100,
    })

    expect(experiences.docs).toHaveLength(9)
    expect(experiences.docs[0]._status).toBe('published')
  })

  it('should seed 25 projects', async () => {
    const projects = await payload.find({
      collection: 'projects',
      limit: 100,
    })

    expect(projects.docs).toHaveLength(25)
    
    // Check featured projects
    const featured = projects.docs.filter(p => p.featured)
    expect(featured.length).toBeGreaterThan(0)
  })

  it('should seed 1 education', async () => {
    const educations = await payload.find({
      collection: 'educations',
      limit: 100,
    })

    expect(educations.docs).toHaveLength(1)
    expect(educations.docs[0].school).toContain('AMA Computer University')
  })

  it('should seed 65 certifications', async () => {
    const certifications = await payload.find({
      collection: 'certifications',
      limit: 100,
    })

    expect(certifications.docs).toHaveLength(65)
    expect(certifications.docs[0]._status).toBe('published')
  })

  it('should have correct project ordering', async () => {
    const projects = await payload.find({
      collection: 'projects',
      limit: 5,
      sort: 'order',
    })

    expect(projects.docs[0].order).toBe(1)
    expect(projects.docs[0].title).toBe('Meet Lessons')
  })

  it('should have valid tech stacks for projects', async () => {
    const projects = await payload.find({
      collection: 'projects',
      limit: 1,
    })

    const project = projects.docs[0]
    expect(project.techStack).toBeDefined()
    expect(Array.isArray(project.techStack)).toBe(true)
    expect(project.techStack.length).toBeGreaterThan(0)
  })
})
