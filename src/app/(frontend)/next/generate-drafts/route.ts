import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { createHash } from 'node:crypto'

import { openAIChat, parseJsonFromString } from '../../../../utilities/openai'

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

const formatMonthYear = (value: unknown): string => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d)
}

const formatYear = (value: unknown): string => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  return String(d.getUTCFullYear())
}

const normalizeUrlForDisplay = (value: string): string => {
  const v = value.trim()
  if (!v) return ''
  return v.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
}

const joinNonEmpty = (parts: Array<string | undefined | null>, separator: string): string => {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(separator)
}

const uniqueStrings = (items: string[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const k = item.trim()
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

const getSocialUrl = (links: Array<{ label?: string; url?: string }>, matcher: RegExp): string => {
  for (const link of links) {
    const label = (link?.label ?? '').trim()
    const url = (link?.url ?? '').trim()
    if (!url) continue
    if (matcher.test(label) || matcher.test(url)) return url
  }
  return ''
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
      experienceRewritePrompt?: string
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

    const siteSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
      overrideAccess: false,
      req: payloadReq,
    })) as unknown as {
      socialLinks?: Array<{ label?: string; url?: string }>
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
        id?: string | number
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
        id?: string | number
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
        id?: string | number
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
        id?: string | number
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

    const socialLinks = Array.isArray(siteSettings.socialLinks) ? siteSettings.socialLinks : []
    const socialLines = uniqueStrings(
      socialLinks
        .map((l) => joinNonEmpty([l?.label, l?.url], ': '))
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
    )

    const portfolioUrl = normalizeUrlForDisplay(
      getSocialUrl(socialLinks, /portfolio|website|site/i) ||
        getSocialUrl(socialLinks, /allanwebdesign\.com/i),
    )
    const linkedinUrl = normalizeUrlForDisplay(getSocialUrl(socialLinks, /linkedin/i))
    const githubUrl = normalizeUrlForDisplay(getSocialUrl(socialLinks, /github/i))
    if (socialLines.length) {
      resumeFactsParts.push('Social Links:')
      for (const line of socialLines) resumeFactsParts.push(`- ${line}`)
    }

    const expDocs = Array.isArray(experiences.docs) ? experiences.docs : []

    const formatProfessionalExperienceBlock = (exp: {
      title?: string
      company?: string
      location?: string
      startDate?: string
      endDate?: string
      current?: boolean
      highlights?: Array<{ text?: string }>
    }): string => {
      const roleTitle = (exp.title ?? '').trim()
      const companyName = (exp.company ?? '').trim()
      const descriptor = (exp.location ?? '').trim()
      const datePart = joinNonEmpty(
        [formatMonthYear(exp.startDate), exp.current ? 'Present' : formatMonthYear(exp.endDate)],
        ' – ',
      )

      const headerLines = [
        roleTitle ? `### **${roleTitle}**` : '',
        companyName ? `**${companyName}**${descriptor ? ` - ${descriptor}` : ''}` : '',
        datePart ? `*${datePart}*` : '',
      ].filter(Boolean)

      const highlights = Array.isArray(exp.highlights) ? exp.highlights : []
      const bullets = highlights
        .map((h) => (h?.text ?? '').trim())
        .filter(Boolean)
        .map((t) => `* ${t}`)

      return [...headerLines, '', ...bullets].join('\n').trim()
    }

    const formatEarlierExperienceLine = (exp: {
      title?: string
      company?: string
      startDate?: string
      endDate?: string
      current?: boolean
    }): string => {
      const title = (exp.title ?? '').trim()
      const company = (exp.company ?? '').trim()
      const startYear = formatYear(exp.startDate)
      const endYear = exp.current ? 'Present' : formatYear(exp.endDate)
      const yearRange = joinNonEmpty([startYear, endYear], '–')

      const left = title ? `**${title}**` : ''
      const mid = company ? ` - ${company}` : ''
      const right = yearRange ? ` (${yearRange})` : ''
      return `${left}${mid}${right}`.trim()
    }

    const professionalExpDocs = expDocs.filter((e) => Boolean(e?.current))
    const earlierExpDocs = expDocs.filter((e) => !e?.current)

    const professionalExperienceBlocks = professionalExpDocs
      .map(formatProfessionalExperienceBlock)
      .filter(Boolean)
      .join('\n\n---\n\n')

    const earlierExperienceLines = earlierExpDocs
      .map(formatEarlierExperienceLine)
      .filter(Boolean)
      .join('\n')
    if (expDocs.length) {
      resumeFactsParts.push('\nEXPERIENCE')
      for (const exp of expDocs) {
        const expId = exp.id != null ? String(exp.id) : ''
        const datePart = joinNonEmpty(
          [formatDate(exp.startDate), exp.current ? 'Present' : formatDate(exp.endDate)],
          ' - ',
        )
        const header = joinNonEmpty(
          [joinNonEmpty([exp.title, exp.company], ' @ '), exp.location, datePart],
          ' | ',
        )
        if (header) resumeFactsParts.push(`- [exp:${expId}] ${header}`.trim())
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
        const projId = p.id != null ? String(p.id) : ''
        const urls = joinNonEmpty([p.repoUrl, p.liveUrl], ' | ')
        const header = joinNonEmpty([p.title, urls], ' - ')
        if (header) resumeFactsParts.push(`- [proj:${projId}] ${header}`.trim())
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
        const certId = c.id != null ? String(c.id) : ''
        const meta = joinNonEmpty([c.issuer, c.duration, formatDate(c.issueDate)], ' | ')
        const header = joinNonEmpty([c.title, meta], ' - ')
        if (header) resumeFactsParts.push(`- [cert:${certId}] ${header}`.trim())
        if (c.credentialUrl) resumeFactsParts.push(`  - ${c.credentialUrl}`)
      }
    }

    const eduDocs = Array.isArray(educations.docs) ? educations.docs : []
    if (eduDocs.length) {
      resumeFactsParts.push('\nEDUCATION')
      for (const e of eduDocs) {
        const eduId = e.id != null ? String(e.id) : ''
        const datePart = joinNonEmpty([formatDate(e.startDate), formatDate(e.endDate)], ' - ')
        const header = joinNonEmpty(
          [e.school, joinNonEmpty([e.degree, e.fieldOfStudy], ', '), e.location, datePart],
          ' | ',
        )
        if (header) resumeFactsParts.push(`- [edu:${eduId}] ${header}`.trim())
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

    const model = aiSettings.model || 'gpt-4o-mini'
    const temperature = typeof aiSettings.temperature === 'number' ? aiSettings.temperature : 0.2
    const promptVersion = aiSettings.promptVersion || 'phase5-v1'
    const system =
      aiSettings.systemPrompt ||
      'You are a strict resume and cover letter drafting assistant. Do not invent facts. Only use information provided in the resume profile and job ad. If something is missing, omit it.'

    type SelectionJson = {
      experienceIds?: string[]
      projectIds?: string[]
      certificationIds?: string[]
      educationIds?: string[]
    }

    let selected: SelectionJson | null = null
    try {
      const raw = await openAIChat({
        apiKey,
        model,
        temperature: 0,
        responseFormat: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              'Select ONLY the resume items that are most relevant to the job ad.',
              '',
              'Rules:',
              '- Use ONLY IDs that appear in the Resume Facts in tags like [exp:ID], [proj:ID], [cert:ID], [edu:ID]',
              '- Prefer Python/automation/API/LLM workflow items when the job asks for those',
              '- Return JSON only with arrays (empty arrays allowed)',
              '',
              'Return JSON shape:',
              '{"experienceIds":[],"projectIds":[],"certificationIds":[],"educationIds":[]}',
              '',
              `Job Title: ${jobAd.title ?? ''}`,
              '',
              `Job Ad:\n${jdText}`,
              '',
              `Resume Facts:\n${resumeFacts}`,
            ].join('\n'),
          },
        ],
        maxTokens: 400,
      })

      selected = parseJsonFromString<SelectionJson>(raw)
    } catch {
      selected = null
    }

    const selectionCount =
      (selected?.experienceIds?.length ?? 0) +
      (selected?.projectIds?.length ?? 0) +
      (selected?.certificationIds?.length ?? 0) +
      (selected?.educationIds?.length ?? 0)
    if (selected && selectionCount === 0) selected = null

    const keepExp = new Set((selected?.experienceIds ?? []).map(String))
    const keepProj = new Set((selected?.projectIds ?? []).map(String))
    const keepCert = new Set((selected?.certificationIds ?? []).map(String))
    const keepEdu = new Set((selected?.educationIds ?? []).map(String))

    const buildSelectedFacts = (): string => {
      const parts: string[] = []

      if (!selected) return resumeFactsParts.join('\n').trim()

      let currentType: null | 'exp' | 'proj' | 'cert' | 'edu' = null
      let keepCurrent = true

      const resetItem = (): void => {
        currentType = null
        keepCurrent = true
      }

      const isSectionHeading = (line: string): boolean => {
        const t = line.trim()
        return (
          t === 'EXPERIENCE' ||
          t === 'PROJECTS' ||
          t === 'CERTIFICATIONS' ||
          t === 'EDUCATION' ||
          t === 'Social Links:'
        )
      }

      for (const line of resumeFactsParts) {
        if (isSectionHeading(line)) {
          resetItem()
          parts.push(line)
          continue
        }

        const taggedHeader = line.match(/^-\s+\[(exp|proj|cert|edu):([^\]]*)\]/)
        if (taggedHeader) {
          const type = taggedHeader[1] as 'exp' | 'proj' | 'cert' | 'edu'
          const id = (taggedHeader[2] ?? '').trim()

          currentType = type
          if (!id) {
            keepCurrent = true
          } else if (type === 'exp') {
            keepCurrent = keepExp.has(id)
          } else if (type === 'proj') {
            keepCurrent = keepProj.has(id)
          } else if (type === 'cert') {
            keepCurrent = keepCert.has(id)
          } else {
            keepCurrent = keepEdu.has(id)
          }

          if (keepCurrent) parts.push(line)
          continue
        }

        if (currentType && !keepCurrent && line.startsWith('  -')) {
          continue
        }

        parts.push(line)
      }

      return parts.join('\n').trim()
    }

    const selectedResumeFacts = buildSelectedFacts()

    type ExperienceRewriteJson = {
      experiences?: Array<{
        id?: string
        roleTitle?: string
        highlights?: string[]
      }>
    }

    const rewriteCurrentExperiences = async (): Promise<
      Map<string, { roleTitle: string; highlights: string[] }>
    > => {
      const out = new Map<string, { roleTitle: string; highlights: string[] }>()
      if (!professionalExpDocs.length) return out

      const payloadForAI = professionalExpDocs
        .map((e) => {
          const id = e.id != null ? String(e.id) : ''
          const title = (e.title ?? '').trim()
          const company = (e.company ?? '').trim()
          const descriptor = (e.location ?? '').trim()
          const dates = joinNonEmpty(
            [formatMonthYear(e.startDate), e.current ? 'Present' : formatMonthYear(e.endDate)],
            ' – ',
          )
          const highlights = (Array.isArray(e.highlights) ? e.highlights : [])
            .map((h) => (h?.text ?? '').trim())
            .filter(Boolean)
          return {
            id,
            title,
            company,
            descriptor,
            dates,
            highlights,
          }
        })
        .filter((e) => e.id && (e.title || e.highlights.length))

      if (!payloadForAI.length) return out

      const currentExperiencesJson = JSON.stringify(payloadForAI, null, 2)

      const rewritePrompt = renderTemplate(
        aiSettings.experienceRewritePrompt ||
          [
            'Rewrite CURRENT work experiences to better match the job ad while staying strictly factual.',
            '',
            'Rules:',
            '- Do NOT invent facts',
            '- Do NOT change company names or dates',
            '- Do NOT add or imply freelance, self-employed, contractor, contractual, or project-based roles',
            '- You MAY rewrite the role title (wording only) to align with the job ad',
            '- If helpful and justified by the provided facts, you MAY append ONE aligned title variant using: "<Original Title> | <Aligned Title Variant>"',
            '- You MAY rewrite each highlight bullet for clarity and relevance, but you must preserve the meaning, align it with the job ad',
            '- Highlights must be plain text strings (do NOT include leading "*" or "-" bullet markers)',
            '- Keep highlights concise, action-oriented, and ATS-friendly',
            '- Keep bullet count <= original bullet count for that experience',
            '- Return JSON only',
            '',
            'Return JSON shape:',
            '{"experiences":[{"id":"<expId>","roleTitle":"<custom title>","highlights":["..."]}]}',
            '',
            'Job Title: {{jobTitle}}',
            '',
            'Job Ad:',
            '{{jdText}}',
            '',
            'Current Experiences (authoritative source):',
            '{{currentExperiencesJson}}',
          ].join('\n'),
        {
          jobTitle: jobAd.title ?? '',
          jdText,
          currentExperiencesJson,
        },
      )

      let rewritten: ExperienceRewriteJson | null = null
      try {
        const raw = await openAIChat({
          apiKey,
          model,
          temperature: 0,
          responseFormat: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content: rewritePrompt,
            },
          ],
          maxTokens: 900,
        })

        rewritten = parseJsonFromString<ExperienceRewriteJson>(raw)
      } catch {
        rewritten = null
      }

      const items = Array.isArray(rewritten?.experiences) ? rewritten?.experiences : []
      for (const item of items) {
        const id = (item?.id ?? '').trim()
        if (!id) continue
        const roleTitle = (item?.roleTitle ?? '').trim()
        const highlights = Array.isArray(item?.highlights)
          ? item.highlights
              .map((h) => String(h).trim())
              .map((h) => h.replace(/^[-*•]+\s*/u, '').trim())
              .filter(Boolean)
          : []
        if (!roleTitle && !highlights.length) continue
        out.set(id, { roleTitle, highlights })
      }

      return out
    }

    const rewrittenCurrent = await rewriteCurrentExperiences()

    const formatProfessionalExperienceBlockCustom = (exp: {
      id?: string | number
      title?: string
      company?: string
      location?: string
      startDate?: string
      endDate?: string
      current?: boolean
      highlights?: Array<{ text?: string }>
    }): string => {
      const expId = exp.id != null ? String(exp.id) : ''
      const override = expId ? rewrittenCurrent.get(expId) : undefined

      const roleTitle = (override?.roleTitle ?? '').trim() || (exp.title ?? '').trim()
      const companyName = (exp.company ?? '').trim()
      const descriptor = (exp.location ?? '').trim()
      const datePart = joinNonEmpty(
        [formatMonthYear(exp.startDate), exp.current ? 'Present' : formatMonthYear(exp.endDate)],
        ' – ',
      )

      const headerLines = [
        roleTitle ? `### **${roleTitle}**` : '',
        companyName ? `**${companyName}**${descriptor ? ` — ${descriptor}` : ''}` : '',
        datePart ? `*${datePart}*` : '',
      ].filter(Boolean)

      const originalHighlights = (Array.isArray(exp.highlights) ? exp.highlights : [])
        .map((h) => (h?.text ?? '').trim())
        .filter(Boolean)
      const allowedCount = originalHighlights.length
      const highlightLines = (
        override?.highlights?.length ? override.highlights : originalHighlights
      )
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, allowedCount || undefined)
        .map((t) => `* ${t}`)

      return [...headerLines, '', ...highlightLines].join('\n').trim()
    }

    const getCustomizedHighlightsMarkdown = (exp: {
      id?: string | number
      highlights?: Array<{ text?: string }>
    }): string => {
      const expId = exp.id != null ? String(exp.id) : ''
      const override = expId ? rewrittenCurrent.get(expId) : undefined
      const originalHighlights = (Array.isArray(exp.highlights) ? exp.highlights : [])
        .map((h) => (h?.text ?? '').trim())
        .filter(Boolean)
      const allowedCount = originalHighlights.length
      const highlightLines = (
        override?.highlights?.length ? override.highlights : originalHighlights
      )
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, allowedCount || undefined)
        .map((t) => `* ${t}`)
      return highlightLines.join('\n').trim()
    }

    const professionalExperienceBlocksCustomized = professionalExpDocs
      .map(formatProfessionalExperienceBlockCustom)
      .filter(Boolean)
      .join('\n\n---\n\n')

    const getCustomizedRoleTitle = (exp: { id?: string | number; title?: string }): string => {
      const expId = exp.id != null ? String(exp.id) : ''
      const override = expId ? rewrittenCurrent.get(expId) : undefined
      return (override?.roleTitle ?? '').trim() || (exp.title ?? '').trim()
    }

    const inputHash = createHash('sha256')
      .update(JSON.stringify({ resumeFacts, jdText, posterName, profileFocus }))
      .digest('hex')

    const headline = (resumeProfileGlobal.headline ?? '').trim() || (jobAd.title ?? '').trim()
    const contactBlock = uniqueStrings(
      [
        resumeProfileGlobal.address,
        resumeProfileGlobal.email,
        resumeProfileGlobal.phone,
        ...socialLines,
      ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
    ).join('\n')

    const professionalExperience1Block = professionalExpDocs[0]
      ? formatProfessionalExperienceBlock(professionalExpDocs[0])
      : ''
    const professionalExperience2Block = professionalExpDocs[1]
      ? formatProfessionalExperienceBlock(professionalExpDocs[1])
      : ''

    const professionalExperience1BlockCustomized = professionalExpDocs[0]
      ? formatProfessionalExperienceBlockCustom(professionalExpDocs[0])
      : ''
    const professionalExperience2BlockCustomized = professionalExpDocs[1]
      ? formatProfessionalExperienceBlockCustom(professionalExpDocs[1])
      : ''

    const professionalExperience1TitleCustomized = professionalExpDocs[0]
      ? getCustomizedRoleTitle(professionalExpDocs[0])
      : ''
    const professionalExperience2TitleCustomized = professionalExpDocs[1]
      ? getCustomizedRoleTitle(professionalExpDocs[1])
      : ''

    const professionalExperience1HighlightsCustomized = professionalExpDocs[0]
      ? getCustomizedHighlightsMarkdown(professionalExpDocs[0])
      : ''
    const professionalExperience2HighlightsCustomized = professionalExpDocs[1]
      ? getCustomizedHighlightsMarkdown(professionalExpDocs[1])
      : ''

    const earlierExperience1Line = earlierExpDocs[0]
      ? formatEarlierExperienceLine(earlierExpDocs[0])
      : ''
    const earlierExperience2Line = earlierExpDocs[1]
      ? formatEarlierExperienceLine(earlierExpDocs[1])
      : ''
    const earlierExperience3Line = earlierExpDocs[2]
      ? formatEarlierExperienceLine(earlierExpDocs[2])
      : ''
    const earlierExperience4Line = earlierExpDocs[3]
      ? formatEarlierExperienceLine(earlierExpDocs[3])
      : ''
    const earlierExperience5Line = earlierExpDocs[4]
      ? formatEarlierExperienceLine(earlierExpDocs[4])
      : ''
    const earlierExperience6Line = earlierExpDocs[5]
      ? formatEarlierExperienceLine(earlierExpDocs[5])
      : ''
    const earlierExperience7Line = earlierExpDocs[6]
      ? formatEarlierExperienceLine(earlierExpDocs[6])
      : ''

    const baseVars: Record<string, string> = {
      jdText,
      posterName,
      resumeFacts: selectedResumeFacts,
      profileFocus,
      jobTitle: jobAd.title ?? '',
      companyName: company?.name ?? '',
      fullName,
      headline,
      contactBlock,
      address: resumeProfileGlobal.address ?? '',
      email: resumeProfileGlobal.email ?? '',
      phone: resumeProfileGlobal.phone ?? '',
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      professionalExperienceBlocks,
      professionalExperience1Block,
      professionalExperience2Block,
      professionalExperienceBlocksCustomized,
      professionalExperience1BlockCustomized,
      professionalExperience2BlockCustomized,
      professionalExperience1TitleCustomized,
      professionalExperience2TitleCustomized,
      professionalExperience1HighlightsCustomized,
      professionalExperience2HighlightsCustomized,
      earlierExperienceLines,
      earlierExperience1Line,
      earlierExperience2Line,
      earlierExperience3Line,
      earlierExperience4Line,
      earlierExperience5Line,
      earlierExperience6Line,
      earlierExperience7Line,
      jobAdTitle: jobAd.title ?? '',
      jobAdLocation: jobAd.location ?? '',
      jobAdUrl: jobAd.jobUrl ?? '',
      jobAdPosterName: jobAd.posterName ?? '',
      jobAdStatus: (jobAd as { status?: string }).status ?? '',
      companyWebsite: company?.website ?? '',
      companyAbout: company?.about ?? '',
      companyToneNotes: company?.toneNotes ?? '',
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
