import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'

type RelIdValue = number | string | { id?: string | number } | null | undefined

const getRelIdAsNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return getRelIdAsNumber((value as { id?: unknown }).id)
  }
  return null
}

export const Generations: CollectionConfig = {
  slug: 'generations',
  access: {
    create: adminOrEditor,
    delete: adminOrEditor,
    read: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['jobAd', 'company', 'resumeProfile', 'status', 'updatedAt'],
    useAsTitle: 'jobAd',
    listSearchableFields: ['jobAd.title'],
    components: {
      edit: {
        editMenuItems: [
          '@/components/GenerateDraftsMenuItem#GenerateDraftsMenuItem',
          '@/components/DeleteVersionsMenuItem#DeleteVersionsMenuItem',
        ],
      },
    },
  },
  fields: [
    {
      name: 'jobAd',
      type: 'relationship',
      relationTo: 'jobAds',
      required: true,
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      access: {
        update: () => false,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'resumeProfile',
      type: 'relationship',
      relationTo: 'resumeProfiles',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: ['draft', 'generating', 'ready_for_review', 'approved', 'exported', 'failed'],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'resumeDraft',
      type: 'textarea',
    },
    {
      name: 'resumeDraftCopyButtons',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Fields/CopyTextareaButtons#CopyTextareaButtons',
        },
        custom: {
          targetField: 'resumeDraft',
          variant: 'resume',
        },
      },
    },
    {
      name: 'applicationLetter',
      type: 'textarea',
    },
    {
      name: 'applicationLetterCopyButtons',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Fields/CopyTextareaButtons#CopyTextareaButtons',
        },
        custom: {
          targetField: 'applicationLetter',
          variant: 'letter',
        },
      },
    },
    {
      name: 'toneNotes',
      type: 'textarea',
      admin: {
        description:
          'Optional. Tone/voice notes for this attempt (overrides company tone notes and defaults).',
      },
    },
    {
      name: 'applicationLetterStyle',
      type: 'textarea',
      admin: {
        description:
          'Optional. Paste your preferred letter style here to override the global default for this attempt.',
      },
    },
    {
      name: 'coverLetterGreeting',
      type: 'text',
      admin: {
        description: 'Optional override. Example: Hi Mike,',
      },
    },
    {
      name: 'coverLetterHeader',
      type: 'textarea',
    },
    {
      name: 'coverLetterFooter',
      type: 'textarea',
    },
    {
      name: 'promptVersion',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'model',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'temperature',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'inputHash',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'resumeGoogleDocUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'coverLetterGoogleDocUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'exportedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const incomingJobAd = (data as { jobAd?: RelIdValue } | null | undefined)?.jobAd
        const incomingCompany = (data as { company?: unknown } | null | undefined)?.company
        const originalJobAd = (originalDoc as { jobAd?: RelIdValue } | null | undefined)?.jobAd

        const jobAdId = getRelIdAsNumber(incomingJobAd ?? originalJobAd)
        if (!jobAdId) return data

        const shouldSyncCompany =
          operation === 'create' ||
          typeof incomingJobAd !== 'undefined' ||
          typeof incomingCompany !== 'undefined'

        if (!shouldSyncCompany) return data

        try {
          const jobAdDoc = await req.payload.findByID({
            collection: 'jobAds',
            depth: 0,
            id: jobAdId,
            overrideAccess: false,
            req,
          })

          const companyId =
            getRelIdAsNumber((jobAdDoc as { company?: RelIdValue } | null | undefined)?.company) ??
            null

          return {
            ...(data as Record<string, unknown>),
            company: companyId,
          }
        } catch {
          return data
        }
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        const docWithCompany = doc as { company?: RelIdValue; jobAd?: RelIdValue }
        if (getRelIdAsNumber(docWithCompany.company)) return doc

        const jobAdId = getRelIdAsNumber(docWithCompany.jobAd)
        if (!jobAdId) return doc

        type Cache = Map<number, number | null>
        const reqWithCache = req as unknown as { __generationsJobAdCompanyIdCache?: Cache }
        const cache =
          reqWithCache.__generationsJobAdCompanyIdCache ??
          (reqWithCache.__generationsJobAdCompanyIdCache = new Map<number, number | null>())

        if (cache.has(jobAdId)) {
          docWithCompany.company = cache.get(jobAdId) ?? null
          return doc
        }

        try {
          const jobAdDoc = await req.payload.findByID({
            collection: 'jobAds',
            depth: 0,
            id: jobAdId,
            overrideAccess: false,
            req,
          })

          const companyId =
            getRelIdAsNumber((jobAdDoc as { company?: RelIdValue } | null | undefined)?.company) ??
            null

          cache.set(jobAdId, companyId)
          docWithCompany.company = companyId
          return doc
        } catch {
          cache.set(jobAdId, null)
          return doc
        }
      },
    ],
  },
  timestamps: true,
}
