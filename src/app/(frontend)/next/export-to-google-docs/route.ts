import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { createGoogleDoc } from '../../../../utilities/google-docs'

type UserWithRoles = {
  roles?: unknown
}

const isAdminOrEditor = (user: unknown): boolean => {
  const roles = (user as UserWithRoles | undefined)?.roles
  return Array.isArray(roles) && (roles.includes('admin') || roles.includes('editor'))
}

type ExportBody = {
  generationId: string | number
}

export const maxDuration = 60

export async function POST(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdminOrEditor(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validate env vars early
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    return Response.json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.' }, { status: 500 })
  }
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return Response.json({ error: 'Missing GOOGLE_DRIVE_FOLDER_ID.' }, { status: 500 })
  }

  let body: ExportBody
  try {
    body = (await req.json()) as ExportBody
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body?.generationId) {
    return Response.json({ error: 'Missing generationId.' }, { status: 400 })
  }

  try {
    // Fetch the generation with populated relationships
    const generation = (await payload.findByID({
      collection: 'generations',
      id: body.generationId,
      depth: 2,
      overrideAccess: false,
      user,
    })) as unknown as {
      id: string | number
      jobAd: {
        title?: string
        company?: { name?: string } | null
      } | null
      resumeProfile: { name?: string } | null
      resumeDraft?: string
      applicationLetter?: string
      coverLetterFooter?: string
      resumeGoogleDocUrl?: string
      coverLetterGoogleDocUrl?: string
      status?: string
    }

    if (!generation) {
      return Response.json({ error: 'Generation not found.' }, { status: 404 })
    }

    const resumeDraft = (generation.resumeDraft ?? '').trim()
    const applicationLetter = (generation.applicationLetter ?? '').trim()

    if (!resumeDraft && !applicationLetter) {
      return Response.json(
        { error: 'Nothing to export. Generate drafts first.' },
        { status: 400 },
      )
    }

    // Build doc titles: "{Company} - {Role} - Resume" / "Cover Letter"
    const companyName =
      (typeof generation.jobAd?.company === 'object'
        ? generation.jobAd?.company?.name
        : null
      )?.trim() || ''
    const jobTitle = generation.jobAd?.title?.trim() || 'Job Application'

    const titlePrefix = companyName ? `${companyName} - ${jobTitle}` : jobTitle

    // 1. Export Resume Doc first (so we can inject its URL into the cover letter footer)
    let resumeDocUrl: string | null = null
    let resumeDocId: string | null = null

    if (resumeDraft) {
      const resumeResult = await createGoogleDoc(`${titlePrefix} - Resume`, resumeDraft)
      resumeDocUrl = resumeResult.documentUrl
      resumeDocId = resumeResult.documentId
    }

    // 2. Export Cover Letter Doc
    //    Inject the resume Google Doc URL into the footer if {{resumeUrl}} placeholder exists
    let coverLetterDocUrl: string | null = null
    let coverLetterDocId: string | null = null

    if (applicationLetter) {
      let letterContent = applicationLetter

      // Replace {{resumeUrl}} in the letter content with the actual resume doc URL
      if (resumeDocUrl) {
        letterContent = letterContent.replace(/\{\{\s*resumeUrl\s*\}\}/g, resumeDocUrl)
      } else {
        // Remove the placeholder if no resume was exported
        letterContent = letterContent.replace(/\{\{\s*resumeUrl\s*\}\}/g, '')
      }

      const letterResult = await createGoogleDoc(`${titlePrefix} - Cover Letter`, letterContent)
      coverLetterDocUrl = letterResult.documentUrl
      coverLetterDocId = letterResult.documentId
    }

    // 3. Update the generation record with exported URLs + timestamp
    await payload.update({
      collection: 'generations',
      id: generation.id,
      data: {
        ...(resumeDocUrl ? { resumeGoogleDocUrl: resumeDocUrl } : {}),
        ...(coverLetterDocUrl ? { coverLetterGoogleDocUrl: coverLetterDocUrl } : {}),
        exportedAt: new Date().toISOString(),
        status: 'exported',
      },
      depth: 0,
      overrideAccess: false,
      user,
    })

    return Response.json({
      message: 'Exported to Google Docs.',
      resume: resumeDocUrl
        ? { documentId: resumeDocId, documentUrl: resumeDocUrl }
        : null,
      coverLetter: coverLetterDocUrl
        ? { documentId: coverLetterDocId, documentUrl: coverLetterDocUrl }
        : null,
    })
  } catch (e) {
    console.error('[export-to-google-docs] Error:', e)
    const message =
      process.env.NODE_ENV !== 'production' && e instanceof Error
        ? e.message
        : 'Export failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
