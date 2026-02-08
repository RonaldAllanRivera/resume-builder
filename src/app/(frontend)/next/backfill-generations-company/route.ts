import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { isAdmin } from '../../../../access/adminOnly'

type Body = {
  batchSize?: number
  dryRun?: boolean
  maxDocs?: number
}

const parseNumericID = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return parseNumericID((value as { id?: unknown }).id)
  }
  return null
}

export const maxDuration = 60

export async function POST(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdmin(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  let body: Body = {}
  try {
    body = (await req.json()) as Body
  } catch {
    body = {}
  }

  const batchSize =
    typeof body.batchSize === 'number' && Number.isFinite(body.batchSize) && body.batchSize > 0
      ? Math.min(Math.floor(body.batchSize), 200)
      : 50

  const maxDocs =
    typeof body.maxDocs === 'number' && Number.isFinite(body.maxDocs) && body.maxDocs > 0
      ? Math.min(Math.floor(body.maxDocs), 5000)
      : 1000

  const dryRun = Boolean(body.dryRun)

  try {
    const payloadReq = await createLocalReq({ user }, payload)

    let processed = 0
    let updated = 0
    let skipped = 0

    const jobAdCompanyCache = new Map<number, number | null>()

    // Always pull from page 1 so updates don't cause pagination gaps.
    while (processed < maxDocs) {
      const result = await payload.find({
        collection: 'generations',
        depth: 0,
        limit: Math.min(batchSize, maxDocs - processed),
        overrideAccess: false,
        req: payloadReq,
        where: {
          or: [
            {
              company: {
                exists: false,
              },
            },
            {
              company: {
                equals: null,
              },
            },
          ],
        },
      })

      const docs = Array.isArray(result?.docs) ? result.docs : []
      if (!docs.length) break

      for (const doc of docs) {
        if (processed >= maxDocs) break
        processed += 1

        const jobAdId = parseNumericID((doc as unknown as { jobAd?: unknown })?.jobAd)
        if (!jobAdId) {
          skipped += 1
          continue
        }

        if (!jobAdCompanyCache.has(jobAdId)) {
          try {
            const jobAdDoc = await payload.findByID({
              collection: 'jobAds',
              id: jobAdId,
              depth: 0,
              overrideAccess: false,
              req: payloadReq,
            })

            const companyId = parseNumericID(
              (jobAdDoc as unknown as { company?: unknown })?.company,
            )
            jobAdCompanyCache.set(jobAdId, companyId)
          } catch {
            jobAdCompanyCache.set(jobAdId, null)
          }
        }

        const companyId = jobAdCompanyCache.get(jobAdId) ?? null
        if (!companyId) {
          skipped += 1
          continue
        }

        if (!dryRun) {
          await payload.update({
            collection: 'generations',
            id: doc.id,
            overrideAccess: false,
            req: payloadReq,
            data: {
              company: companyId,
            },
          })
        }

        updated += 1
      }
    }

    return Response.json({
      success: true,
      dryRun,
      batchSize,
      maxDocs,
      processed,
      updated,
      skipped,
    })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error backfilling generations.company' })
    return new Response('Error backfilling generations.company.', { status: 500 })
  }
}
