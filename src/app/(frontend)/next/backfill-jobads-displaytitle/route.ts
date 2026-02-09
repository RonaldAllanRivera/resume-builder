import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { isAdmin } from '../../../../access/adminOnly'

export const maxDuration = 60

export async function POST(_req: Request): Promise<Response> {
  const payload = await getPayload({ config })

  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdmin(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { docs: jobAds } = await payload.find({
      collection: 'jobAds',
      limit: 500,
      depth: 0,
      pagination: false,
    })

    let updated = 0
    const errors: string[] = []

    for (const jobAd of jobAds) {
      try {
        // Re-save triggers beforeChange hook which computes displayTitle
        await payload.update({
          collection: 'jobAds',
          id: jobAd.id,
          data: {
            title: (jobAd as { title?: string }).title ?? '',
          },
        })
        updated++
      } catch (e) {
        errors.push(`Job Ad ${jobAd.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    return Response.json({
      message: `Backfilled displayTitle for ${updated}/${jobAds.length} job ads`,
      updated,
      total: jobAds.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
