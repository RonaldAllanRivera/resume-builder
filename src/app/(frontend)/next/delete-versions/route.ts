import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { isAdmin } from '../../../../access/adminOnly'

type Body = {
  collection: string
  id: number | string
}

const allowedCollections = new Set([
  'certifications',
  'educations',
  'experiences',
  'pages',
  'posts',
  'projects',
])

const isValidID = (value: unknown): value is number | string => {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return value.trim().length > 0
  return false
}

export async function POST(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdmin(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response('Invalid JSON body.', { status: 400 })
  }

  if (!body?.collection || (!body?.id && body?.id !== 0)) {
    return new Response('Invalid request.', { status: 400 })
  }

  if (!allowedCollections.has(body.collection) || !isValidID(body.id)) {
    return new Response('Invalid request.', { status: 400 })
  }

  const payloadReq = await createLocalReq({ user }, payload)

  await payload.db.deleteVersions({
    collection: body.collection,
    req: payloadReq,
    where: {
      parent: {
        equals: body.id,
      },
    },
  })

  return Response.json({ deleted: true })
}
