import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

type RelIdValue = number | string | { id?: string | number; name?: string } | null | undefined

const extractNumericId = (value: RelIdValue): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number(value.trim())
    return Number.isFinite(n) ? n : null
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return extractNumericId((value as { id?: unknown }).id as RelIdValue)
  }
  return null
}

const resolveCompanyName = (value: RelIdValue): string | null => {
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: string }).name
    return typeof name === 'string' && name.trim() ? name.trim() : null
  }
  return null
}

export const JobAds: CollectionConfig = {
  slug: 'jobAds',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Resume',
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'source', 'createdAt', 'status', 'updatedAt'],
  },
  defaultSort: '-createdAt',
  forceSelect: {
    title: true,
    company: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'displayTitle',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeValidate: [
          ({ siblingData }) => {
            // Prevent manual writes — always computed in beforeChange.
            delete (siblingData as Record<string, unknown>).displayTitle
          },
        ],
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
    },
    {
      name: 'jobUrl',
      type: 'text',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'posterName',
      type: 'text',
    },
    {
      name: 'jobDescription',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: ['new', 'ready', 'generating', 'done', 'failed'],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        const title =
          (data as { title?: string } | null | undefined)?.title ??
          (originalDoc as { title?: string } | null | undefined)?.title ??
          ''

        const companyRaw =
          (data as { company?: RelIdValue } | null | undefined)?.company ??
          (originalDoc as { company?: RelIdValue } | null | undefined)?.company

        let companyName = resolveCompanyName(companyRaw as RelIdValue)

        // If company is just an ID (not populated), look it up.
        if (!companyName && companyRaw) {
          const companyId = extractNumericId(companyRaw)

          if (companyId && Number.isFinite(companyId)) {
            try {
              const companyDoc = await req.payload.findByID({
                collection: 'companies',
                id: companyId,
                depth: 0,
                req,
              })
              companyName = (companyDoc as { name?: string })?.name?.trim() || null
            } catch {
              // Company lookup failed — continue without it.
            }
          }
        }

        const display = companyName ? `${companyName} – ${title}` : String(title || '')

        return {
          ...(data as Record<string, unknown>),
          displayTitle: display,
        }
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        try {
          const d = doc as { displayTitle?: string; title?: string; company?: RelIdValue }
          if (d.displayTitle) return doc

          // Compute displayTitle on the fly for docs saved before the hook existed.
          const title = d.title ?? ''
          const companyRaw = d.company

          let companyName = resolveCompanyName(companyRaw as RelIdValue)

          if (!companyName && companyRaw) {
            const companyId = extractNumericId(companyRaw)

            if (companyId && Number.isFinite(companyId)) {
              // Use a per-request cache to avoid repeated lookups in list views.
              type Cache = Map<number, string | null>
              const reqWithCache = req as unknown as { __jobAdCompanyNameCache?: Cache }
              const cache =
                reqWithCache.__jobAdCompanyNameCache ??
                (reqWithCache.__jobAdCompanyNameCache = new Map<number, string | null>())

              if (cache.has(companyId)) {
                companyName = cache.get(companyId) ?? null
              } else {
                try {
                  const companyDoc = await req.payload.findByID({
                    collection: 'companies',
                    id: companyId,
                    depth: 0,
                    req,
                  })
                  companyName = (companyDoc as { name?: string })?.name?.trim() || null
                } catch {
                  companyName = null
                }
                cache.set(companyId, companyName)
              }
            }
          }

          d.displayTitle = companyName ? `${companyName} – ${title}` : title || ''
          return doc
        } catch (error) {
          // If displayTitle computation fails, return doc as-is to prevent delete failures
          console.error('Error in JobAds afterRead hook:', error)
          return doc
        }
      },
    ],
  },
  timestamps: true,
}
