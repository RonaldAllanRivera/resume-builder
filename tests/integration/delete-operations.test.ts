import { describe, it, expect, beforeAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'

describe('Delete Operations', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  describe('JobAds Collection', () => {
    it('should delete job ad without company', async () => {
      const jobAd = await payload.create({
        collection: 'jobAds',
        data: {
          title: 'Test Job',
          jobDescription: 'Test description',
          status: 'new',
        },
      })

      await expect(
        payload.delete({
          collection: 'jobAds',
          id: jobAd.id,
        }),
      ).resolves.toBeDefined()
    })

    it('should delete job ad with company', async () => {
      const company = await payload.create({
        collection: 'companies',
        data: {
          name: 'Test Company',
        },
      })

      const jobAd = await payload.create({
        collection: 'jobAds',
        data: {
          title: 'Test Job',
          company: company.id,
          jobDescription: 'Test description',
          status: 'new',
        },
      })

      await expect(
        payload.delete({
          collection: 'jobAds',
          id: jobAd.id,
        }),
      ).resolves.toBeDefined()

      // Cleanup
      await payload.delete({
        collection: 'companies',
        id: company.id,
      })
    })

    it('should delete job ad with invalid company reference', async () => {
      const jobAd = await payload.create({
        collection: 'jobAds',
        data: {
          title: 'Test Job',
          company: 999999, // Non-existent company
          jobDescription: 'Test description',
          status: 'new',
        },
      })

      await expect(
        payload.delete({
          collection: 'jobAds',
          id: jobAd.id,
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('Generations Collection', () => {
    it('should delete generation without relationships', async () => {
      const resumeProfile = await payload.create({
        collection: 'resumeProfiles',
        data: {
          name: 'Test Profile',
        },
      })

      const generation = await payload.create({
        collection: 'generations',
        data: {
          jobAd: 1, // Dummy ID for test
          resumeProfile: resumeProfile.id,
          status: 'draft',
        },
        draft: false,
      })

      await expect(
        payload.delete({
          collection: 'generations',
          id: generation.id,
        }),
      ).resolves.toBeDefined()

      // Cleanup
      await payload.delete({
        collection: 'resumeProfiles',
        id: resumeProfile.id,
      })
    })

    it('should delete generation with job ad and company', async () => {
      const company = await payload.create({
        collection: 'companies',
        data: {
          name: 'Test Company',
        },
      })

      const jobAd = await payload.create({
        collection: 'jobAds',
        data: {
          title: 'Test Job',
          company: company.id,
          jobDescription: 'Test description',
          status: 'new',
        },
      })

      const resumeProfile = await payload.create({
        collection: 'resumeProfiles',
        data: {
          name: 'Test Profile',
        },
      })

      const generation = await payload.create({
        collection: 'generations',
        data: {
          jobAd: jobAd.id,
          resumeProfile: resumeProfile.id,
          status: 'draft',
        },
        draft: false,
      })

      await expect(
        payload.delete({
          collection: 'generations',
          id: generation.id,
        }),
      ).resolves.toBeDefined()

      // Cleanup
      await payload.delete({
        collection: 'jobAds',
        id: jobAd.id,
      })
      await payload.delete({
        collection: 'companies',
        id: company.id,
      })
      await payload.delete({
        collection: 'resumeProfiles',
        id: resumeProfile.id,
      })
    })

    it('should delete generation with invalid job ad reference', async () => {
      const resumeProfile = await payload.create({
        collection: 'resumeProfiles',
        data: {
          name: 'Test Profile',
        },
      })

      const generation = await payload.create({
        collection: 'generations',
        data: {
          jobAd: 999999, // Non-existent job ad
          resumeProfile: resumeProfile.id,
          status: 'draft',
        },
        draft: false,
      })

      await expect(
        payload.delete({
          collection: 'generations',
          id: generation.id,
        }),
      ).resolves.toBeDefined()

      // Cleanup
      await payload.delete({
        collection: 'resumeProfiles',
        id: resumeProfile.id,
      })
    })
  })

  describe('Companies Collection', () => {
    it('should delete company', async () => {
      const company = await payload.create({
        collection: 'companies',
        data: {
          name: 'Test Company',
        },
      })

      await expect(
        payload.delete({
          collection: 'companies',
          id: company.id,
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('Projects Collection', () => {
    it('should delete project', async () => {
      const project = await payload.create({
        collection: 'projects',
        data: {
          title: 'Test Project',
          slug: 'test-project-delete',
          _status: 'published',
        },
      })

      await expect(
        payload.delete({
          collection: 'projects',
          id: project.id,
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('Experiences Collection', () => {
    it('should delete experience', async () => {
      const company = await payload.create({
        collection: 'companies',
        data: {
          name: 'Test Company',
        },
      })

      const experience = await payload.create({
        collection: 'experiences',
        data: {
          title: 'Test Position',
          company: String(company.id),
          startDate: '2020-01-01',
          _status: 'published',
        },
      })

      await expect(
        payload.delete({
          collection: 'experiences',
          id: experience.id,
        }),
      ).resolves.toBeDefined()

      // Cleanup
      await payload.delete({
        collection: 'companies',
        id: company.id,
      })
    })
  })

  describe('Certifications Collection', () => {
    it('should delete certification', async () => {
      const certification = await payload.create({
        collection: 'certifications',
        data: {
          title: 'Test Certification',
          issuer: 'Test Issuer',
          _status: 'published',
        },
      })

      await expect(
        payload.delete({
          collection: 'certifications',
          id: certification.id,
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('Educations Collection', () => {
    it('should delete education', async () => {
      const education = await payload.create({
        collection: 'educations',
        data: {
          school: 'Test University',
          degree: 'Test Degree',
          _status: 'published',
        },
      })

      await expect(
        payload.delete({
          collection: 'educations',
          id: education.id,
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('Posts Collection', () => {
    it('should delete post without authors', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Post',
          slug: 'test-post-delete',
          content: {
            root: {
              type: 'root',
              children: [],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
        draft: false,
      })

      await expect(
        payload.delete({
          collection: 'posts',
          id: post.id,
        }),
      ).resolves.toBeDefined()
    })

    it('should delete post with authors', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'test-delete@example.com',
          password: 'test123',
          roles: ['admin'],
        },
      })

      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Post',
          slug: 'test-post-delete-authors',
          authors: [user.id],
          content: {
            root: {
              type: 'root',
              children: [],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
        draft: false,
      })

      await expect(
        payload.delete({
          collection: 'posts',
          id: post.id,
        }),
      ).resolves.toBeDefined()

      // Cleanup
      await payload.delete({
        collection: 'users',
        id: user.id,
      })
    })
  })

  describe('Pages Collection', () => {
    it('should delete page', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Test Page',
          slug: 'test-page-delete',
          hero: {
            type: 'none',
          },
          layout: [],
        },
        draft: false,
      })

      await expect(
        payload.delete({
          collection: 'pages',
          id: page.id,
        }),
      ).resolves.toBeDefined()
    })
  })

  describe('Resume Profiles Collection', () => {
    it('should delete resume profile', async () => {
      const profile = await payload.create({
        collection: 'resumeProfiles',
        data: {
          name: 'Test Profile',
        },
      })

      await expect(
        payload.delete({
          collection: 'resumeProfiles',
          id: profile.id,
        }),
      ).resolves.toBeDefined()
    })
  })
})
