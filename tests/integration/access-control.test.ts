import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'test-password-change-me'

describe('Access Control', () => {
  let payload: Payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminUser: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let editorUser: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let regularUser: any

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Create test users
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@test.com',
        password: TEST_PASSWORD,
        roles: ['admin'],
      },
    })

    editorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'editor@test.com',
        password: TEST_PASSWORD,
        roles: ['editor'],
      },
    })

    regularUser = await payload.create({
      collection: 'users',
      data: {
        email: 'user@test.com',
        password: TEST_PASSWORD,
        roles: ['editor'],
      },
    })
  })

  afterAll(async () => {
    // Clean up test users
    if (payload) {
      await payload.delete({
        collection: 'users',
        where: {
          email: {
            in: ['admin@test.com', 'editor@test.com', 'user@test.com'],
          },
        },
      })
      await payload.destroy()
    }
  })

  it('should allow admin to create experiences', async () => {
    const result = await payload.create({
      collection: 'experiences',
      data: {
        title: 'Test Experience',
        company: 'Test Company',
        startDate: '2020-01-01',
        current: false,
        endDate: '2021-01-01',
        order: 1,
        _status: 'published',
      },
      user: adminUser,
      overrideAccess: false,
    })

    expect(result.id).toBeDefined()
    expect(result.title).toBe('Test Experience')
  })

  it('should allow editor to create experiences', async () => {
    const result = await payload.create({
      collection: 'experiences',
      data: {
        title: 'Editor Experience',
        company: 'Test Company',
        startDate: '2020-01-01',
        current: false,
        endDate: '2021-01-01',
        order: 2,
        _status: 'published',
      },
      user: editorUser,
      overrideAccess: false,
    })

    expect(result.id).toBeDefined()
  })

  it('should deny regular user from creating experiences', async () => {
    await expect(
      payload.create({
        collection: 'experiences',
        data: {
          title: 'User Experience',
          company: 'Test Company',
          startDate: '2020-01-01',
          current: false,
          endDate: '2021-01-01',
          order: 3,
          _status: 'published',
        },
        user: regularUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('should allow public read access to published experiences', async () => {
    const result = await payload.find({
      collection: 'experiences',
      where: {
        _status: {
          equals: 'published',
        },
      },
      overrideAccess: false,
    })

    expect(result.docs.length).toBeGreaterThan(0)
  })

  it('should allow admin to update site settings', async () => {
    const result = await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        siteName: 'Test Site',
      },
      user: adminUser,
    })

    expect(result.siteName).toBe('Test Site')
  })

  it('should deny regular user from updating site settings', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          siteName: 'Hacked Site',
        },
        user: regularUser,
      }),
    ).rejects.toThrow()
  })
})
