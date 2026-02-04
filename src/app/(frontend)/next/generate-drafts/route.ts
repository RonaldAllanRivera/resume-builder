import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { createHash } from 'node:crypto'

import { openAIChat } from '../../../../utilities/openai'

type UserWithRoles = {
  roles?: unknown
}

const isAdminOrEditor = (user: unknown): boolean => {
  const roles = (user as UserWithRoles | undefined)?.roles
  return Array.isArray(roles) && (roles.includes('admin') || roles.includes('editor'))
}

type GenerateDraftsBody = {
  generationId: string | number
}

const renderTemplate = (template: string, vars: Record<string, string>): string => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? (vars[key] ?? '') : ''
  })
}

const formatDate = (value: unknown): string => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const joinNonEmpty = (parts: Array<string | undefined | null>, separator: string): string => {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(separator)
}

export const maxDuration = 60

export async function POST(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdminOrEditor(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response('Missing OPENAI_API_KEY.', { status: 500 })
  }

  let body: GenerateDraftsBody
  try {
    body = (await req.json()) as GenerateDraftsBody
  } catch {
    return new Response('Invalid JSON body.', { status: 400 })
  }

  if (!body?.generationId) {
    return new Response('Missing generationId.', { status: 400 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)

    await payload.update({
      collection: 'generations',
      id: body.generationId,
      data: {
        status: 'generating',
      },
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })

    const generation = (await payload.findByID({
      collection: 'generations',
      id: body.generationId,
      depth: 2,
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      id: string | number
      jobAd: unknown
      resumeProfile: unknown
      toneNotes?: string
      applicationLetterStyle?: string
      coverLetterGreeting?: string
      coverLetterHeader?: string
      coverLetterFooter?: string
    }

    const jobAd = generation.jobAd as {
      title?: string
      posterName?: string
      location?: string
      jobUrl?: string
      jobDescription?: string
      company?: unknown
    }

    const company = (jobAd.company ?? null) as null | {
      name?: string
      website?: string
      about?: string
      toneNotes?: string
    }

    const resumeProfile = generation.resumeProfile as {
      name?: string
      resumeText?: string
      notes?: string
    }

    const coverLetterSettings = (await payload.findGlobal({
      slug: 'coverLetterSettings',
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      defaultGreetingTemplate?: string
      defaultHeader?: string
      defaultFooter?: string
    }

    const aiSettings = (await payload.findGlobal({
      slug: 'aiGenerationSettings',
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      promptVersion?: string
      model?: string
      temperature?: number
      systemPrompt?: string
      resumePrompt?: string
      coverLetterStyle?: string
      coverLetterPrompt?: string
    }

    const posterName = jobAd.posterName?.trim() || 'Hiring Manager'
    const greetingTemplate =
      generation.coverLetterGreeting?.trim() ||
      coverLetterSettings.defaultGreetingTemplate ||
      'Hi {{posterName}},'

    const resolvedGreeting = greetingTemplate.replace(/\{\{posterName\}\}/g, posterName)
    const resolvedHeader = generation.coverLetterHeader ?? coverLetterSettings.defaultHeader ?? ''
    const resolvedFooter = generation.coverLetterFooter ?? coverLetterSettings.defaultFooter ?? ''

    const profileFocus = joinNonEmpty([resumeProfile.resumeText, resumeProfile.notes], '\n\n')
    const jdText = (jobAd.jobDescription ?? '').trim()

    if (!jdText) {
      return new Response('Missing job description.', { status: 400 })
    }

    const resumeProfileGlobal = (await payload.findGlobal({
      slug: 'resumeProfile',
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      fullName?: string
      headline?: string
      summary?: string
      email?: string
      phone?: string
      address?: string
      dateOfBirth?: string
    }

    const experiences = (await payload.find({
      collection: 'experiences',
      depth: 0,
      limit: 200,
      sort: 'order',
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      docs?: Array<{
        title?: string
        company?: string
        location?: string
        startDate?: string
        endDate?: string
        current?: boolean
        highlights?: Array<{ text?: string }>
      }>
    }

    const projects = (await payload.find({
      collection: 'projects',
      depth: 0,
      limit: 200,
      sort: 'order',
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      docs?: Array<{
        title?: string
        summary?: string
        repoUrl?: string
        liveUrl?: string
        techStack?: Array<{ name?: string }>
      }>
    }

    const certifications = (await payload.find({
      collection: 'certifications',
      depth: 0,
      limit: 200,
      sort: 'order',
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      docs?: Array<{
        title?: string
        issuer?: string
        duration?: string
        issueDate?: string
        credentialUrl?: string
      }>
    }

    const educations = (await payload.find({
      collection: 'educations',
      depth: 0,
      limit: 200,
      sort: 'order',
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      docs?: Array<{
        school?: string
        degree?: string
        fieldOfStudy?: string
        location?: string
        startDate?: string
        endDate?: string
        highlights?: Array<{ text?: string }>
      }>
    }

    const resumeFactsParts: string[] = []

    const fullName = (resumeProfileGlobal.fullName ?? '').trim()
    if (fullName) resumeFactsParts.push(`Name: ${fullName}`)
    if (resumeProfileGlobal.headline)
      resumeFactsParts.push(`Headline: ${resumeProfileGlobal.headline}`)
    if (resumeProfileGlobal.summary)
      resumeFactsParts.push(`Summary: ${resumeProfileGlobal.summary}`)
    if (resumeProfileGlobal.email) resumeFactsParts.push(`Email: ${resumeProfileGlobal.email}`)
    if (resumeProfileGlobal.phone) resumeFactsParts.push(`Phone: ${resumeProfileGlobal.phone}`)
    if (resumeProfileGlobal.address)
      resumeFactsParts.push(`Address: ${resumeProfileGlobal.address}`)
    if (resumeProfileGlobal.dateOfBirth)
      resumeFactsParts.push(`Date of Birth: ${formatDate(resumeProfileGlobal.dateOfBirth)}`)

    const expDocs = Array.isArray(experiences.docs) ? experiences.docs : []
    if (expDocs.length) {
      resumeFactsParts.push('\nEXPERIENCE')
      for (const exp of expDocs) {
        const datePart = joinNonEmpty(
          [formatDate(exp.startDate), exp.current ? 'Present' : formatDate(exp.endDate)],
          ' - ',
        )
        const header = joinNonEmpty(
          [joinNonEmpty([exp.title, exp.company], ' @ '), exp.location, datePart],
          ' | ',
        )
        if (header) resumeFactsParts.push(`- ${header}`)
        const highlights = Array.isArray(exp.highlights) ? exp.highlights : []
        for (const h of highlights) {
          if (h?.text) resumeFactsParts.push(`  - ${h.text}`)
        }
      }
    }

    const projDocs = Array.isArray(projects.docs) ? projects.docs : []
    if (projDocs.length) {
      resumeFactsParts.push('\nPROJECTS')
      for (const p of projDocs) {
        const urls = joinNonEmpty([p.repoUrl, p.liveUrl], ' | ')
        const header = joinNonEmpty([p.title, urls], ' — ')
        if (header) resumeFactsParts.push(`- ${header}`)
        if (p.summary) resumeFactsParts.push(`  - ${p.summary}`)
        const tech = (Array.isArray(p.techStack) ? p.techStack : [])
          .map((t) => (t?.name ?? '').trim())
          .filter(Boolean)
        if (tech.length) resumeFactsParts.push(`  - Tech: ${tech.join(', ')}`)
      }
    }

    const certDocs = Array.isArray(certifications.docs) ? certifications.docs : []
    if (certDocs.length) {
      resumeFactsParts.push('\nCERTIFICATIONS')
      for (const c of certDocs) {
        const meta = joinNonEmpty([c.issuer, c.duration, formatDate(c.issueDate)], ' | ')
        const header = joinNonEmpty([c.title, meta], ' — ')
        if (header) resumeFactsParts.push(`- ${header}`)
        if (c.credentialUrl) resumeFactsParts.push(`  - ${c.credentialUrl}`)
      }
    }

    const eduDocs = Array.isArray(educations.docs) ? educations.docs : []
    if (eduDocs.length) {
      resumeFactsParts.push('\nEDUCATION')
      for (const e of eduDocs) {
        const datePart = joinNonEmpty([formatDate(e.startDate), formatDate(e.endDate)], ' - ')
        const header = joinNonEmpty(
          [e.school, joinNonEmpty([e.degree, e.fieldOfStudy], ', '), e.location, datePart],
          ' | ',
        )
        if (header) resumeFactsParts.push(`- ${header}`)
        const highlights = Array.isArray(e.highlights) ? e.highlights : []
        for (const h of highlights) {
          if (h?.text) resumeFactsParts.push(`  - ${h.text}`)
        }
      }
    }

    const resumeFacts = resumeFactsParts.join('\n').trim()
    if (!resumeFacts) {
      return new Response('Missing resume facts in database.', { status: 400 })
    }

    const inputHash = createHash('sha256')
      .update(JSON.stringify({ resumeFacts, jdText, posterName, profileFocus }))
      .digest('hex')

    const model = aiSettings.model || 'gpt-4o-mini'
    const temperature = typeof aiSettings.temperature === 'number' ? aiSettings.temperature : 0.2
    const promptVersion = aiSettings.promptVersion || 'phase5-v1'
    const system =
      aiSettings.systemPrompt ||
      'You are a strict resume and cover letter drafting assistant. Do not invent facts. Only use information provided in the resume profile and job ad. If something is missing, omit it.'

    const baseVars: Record<string, string> = {
      jdText,
      posterName,
      resumeFacts,
      profileFocus,
      jobTitle: jobAd.title ?? '',
      companyName: company?.name ?? '',
    }

    const resumeDraft = await openAIChat({
      apiKey,
      model,
      temperature,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: renderTemplate(
            aiSettings.resumePrompt ||
              'Create a job-targeted resume based ONLY on the resume facts and the job ad.\n\nRules:\n- Do not invent facts (no new companies, dates, titles, skills, metrics)\n- Prefer the most relevant experiences/projects for this role\n- Keep it ATS-friendly (plain text)\n- Use clear section headings\n\nProfile focus (optional):\n{{profileFocus}}\n\nResume Facts (from database):\n{{resumeFacts}}\n\nJob Ad Title:\n{{jobTitle}}\n\nCompany:\n{{companyName}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return only the final resume text.',
            baseVars,
          ),
        },
      ],
      maxTokens: 2600,
    })

    const companyBlock = company
      ? `Company Notes:\nName: ${company.name ?? ''}\nWebsite: ${company.website ?? ''}\nAbout: ${company.about ?? ''}\nTone Notes: ${company.toneNotes ?? ''}`
      : ''

    const toneNotes = (generation.toneNotes ?? '').trim()
      ? (generation.toneNotes ?? '').trim()
      : joinNonEmpty([company?.toneNotes, resumeProfile.notes, profileFocus], '\n')

    const coverLetterStyle = (generation.applicationLetterStyle ?? '').trim()
      ? (generation.applicationLetterStyle ?? '').trim()
      : (aiSettings.coverLetterStyle ?? '').trim()

    const applicationLetter = await openAIChat({
      apiKey,
      model,
      temperature,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: renderTemplate(
            aiSettings.coverLetterPrompt ||
              'Write an application letter based on the resume and the job ad.\n\nRules:\n- 3 to 5 short paragraphs\n- Do not invent facts\n- Use the greeting, header, and footer EXACTLY as provided\n- Match the provided letter style and tone notes\n\nLetter style (example to mimic):\n{{coverLetterStyle}}\n\nTone notes:\n{{toneNotes}}\n\nHeader (may be empty):\n{{resolvedHeader}}\n\nGreeting:\n{{resolvedGreeting}}\n\nFooter (must include as-is):\n{{resolvedFooter}}\n\n{{companyBlock}}\n\nGenerated Resume:\n{{generatedResume}}\n\nJob Ad:\n{{jdText}}\n\nOutput: Return the full application letter text including header (if present), greeting, body, and footer.',
            {
              ...baseVars,
              companyBlock,
              coverLetterStyle,
              toneNotes,
              generatedResume: resumeDraft,
              resolvedHeader,
              resolvedGreeting,
              resolvedFooter,
            },
          ),
        },
      ],
      maxTokens: 1400,
    })

    await payload.update({
      collection: 'generations',
      id: generation.id,
      data: {
        status: 'ready_for_review',
        resumeDraft,
        applicationLetter,
        coverLetterGreeting: resolvedGreeting,
        coverLetterHeader: resolvedHeader,
        coverLetterFooter: resolvedFooter,
        promptVersion,
        model,
        temperature,
        inputHash,
      },
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error generating drafts' })

    try {
      const payloadReq = await createLocalReq({ user }, payload)
      await payload.update({
        collection: 'generations',
        id: body.generationId,
        data: {
          status: 'failed',
        },
        depth: 0,
        overrideAccess: false,
        req: payloadReq,
      })
    } catch {
      // ignore
    }

    return new Response('Error generating drafts.', { status: 500 })
  }
}
