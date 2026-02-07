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
      projectsRewritePrompt?: string
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
        order?: number
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
              '- Select items that directly match the job ad requirements, skills, tools, and domain keywords',
              '- Certifications: pick the most job-relevant certifications (skills/tools/stack alignment)',
              '- Prefer certifications whose titles clearly match job keywords (e.g. Python/Django/DRF/REST APIs/PostgreSQL/MySQL OR PHP/Laravel/WordPress OR Node.js/React/Vue/Next.js)',
              '- If those exist, do NOT select unrelated topics (e.g. Node.js, WordPress, Vue, React) unless the job ad explicitly calls for them',
              '- For certifications, return up to 5 IDs in order from MOST relevant to LEAST relevant',
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

    const normalizeProjectUrl = (input: string): string => {
      const t = (input ?? '').trim()
      if (!t) return ''
      return t
    }

    type ProjectRewriteJson = {
      projects?: Array<{
        id?: string
        bullets?: string[]
      }>
    }

    const pickTopProjects = (): typeof projDocs => {
      const allProjects = projDocs
      if (!allProjects.length) return []

      const selectedIds = Array.isArray(selected?.projectIds)
        ? selected.projectIds.map((id) => String(id).trim()).filter(Boolean)
        : []

      const byId = new Map<string, (typeof allProjects)[number]>()
      for (const p of allProjects) {
        const id = p?.id != null ? String(p.id) : ''
        if (id) byId.set(id, p)
      }

      const picked: Array<(typeof allProjects)[number]> = []
      for (const id of selectedIds) {
        const doc = byId.get(id)
        if (doc) picked.push(doc)
        if (picked.length >= 3) break
      }

      if (picked.length) return picked
      return allProjects.filter(Boolean).slice(0, 3)
    }

    const topProjects = pickTopProjects()

    const rewriteLatestProjects = async (): Promise<Map<string, { bullets: string[] }>> => {
      const out = new Map<string, { bullets: string[] }>()
      if (!topProjects.length) return out

      const payloadForAI = topProjects
        .map((p) => {
          const id = p.id != null ? String(p.id) : ''
          const title = (p.title ?? '').trim()
          const summary = (p.summary ?? '').trim()
          const tech = (Array.isArray(p.techStack) ? p.techStack : [])
            .map((t) => (t?.name ?? '').trim())
            .filter(Boolean)

          return {
            id,
            title,
            summary,
            tech,
          }
        })
        .filter((p) => p.id && (p.title || p.summary || p.tech.length))

      if (!payloadForAI.length) return out

      const projectsJson = JSON.stringify(payloadForAI, null, 2)

      const rewritePrompt = renderTemplate(
        aiSettings.projectsRewritePrompt ||
          [
            'Summarize the following projects into short resume bullets tailored to the job ad.',
            '',
            'Rules:',
            '- Do NOT invent facts',
            "- Use ONLY information present in each project's title/summary/tech",
            '- Output 2 to 3 bullets per project (prefer 3 when possible)',
            '- Bullets must be concise and ATS-friendly (aim ~10-18 words each)',
            '- Bullets must be plain text strings (no leading "*" or "-" markers)',
            '- Return JSON only',
            '',
            'Return JSON shape:',
            '{"projects":[{"id":"<projId>","bullets":["...","...","..."]}]}',
            '',
            'Job Title: {{jobTitle}}',
            '',
            'Job Ad:',
            '{{jdText}}',
            '',
            'Projects (authoritative source):',
            '{{projectsJson}}',
          ].join('\n'),
        {
          jobTitle: jobAd.title ?? '',
          jdText,
          projectsJson,
        },
      )

      let rewritten: ProjectRewriteJson | null = null
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
          maxTokens: 700,
        })
        rewritten = parseJsonFromString<ProjectRewriteJson>(raw)
      } catch {
        rewritten = null
      }

      const items = Array.isArray(rewritten?.projects) ? rewritten?.projects : []
      for (const item of items) {
        const id = (item?.id ?? '').trim()
        if (!id) continue
        const bullets = Array.isArray(item?.bullets)
          ? item.bullets
              .map((b) => String(b).trim())
              .map((b) => b.replace(/^[-*•]+\s*/u, '').trim())
              .filter(Boolean)
              .slice(0, 3)
          : []
        if (!bullets.length) continue
        out.set(id, { bullets })
      }

      return out
    }

    const rewrittenProjects = await rewriteLatestProjects()

    const fallbackProjectBullets = (summary: string): string[] => {
      const t = (summary ?? '').trim()
      if (!t) return []
      const sentences = t
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
      return (sentences.length ? sentences : [t]).slice(0, 3)
    }

    const formatLatestProjectBlock = (p: {
      id?: string | number
      title?: string
      summary?: string
      repoUrl?: string
      liveUrl?: string
      techStack?: Array<{ name?: string }>
    }): string => {
      const projId = p.id != null ? String(p.id) : ''
      const override = projId ? rewrittenProjects.get(projId) : undefined

      const title = (p.title ?? '').trim()
      const url = normalizeProjectUrl(p.repoUrl ?? '') || normalizeProjectUrl(p.liveUrl ?? '')
      const tech = (Array.isArray(p.techStack) ? p.techStack : [])
        .map((t) => (t?.name ?? '').trim())
        .filter(Boolean)
      const summary = (p.summary ?? '').trim()

      const aiBullets = (override?.bullets?.length ? override.bullets : [])
        .map((b) => b.trim())
        .filter(Boolean)

      const fallbackBullets = fallbackProjectBullets(summary)
      const bullets = [...aiBullets]
      for (const b of fallbackBullets) {
        if (bullets.length >= 3) break
        if (!b.trim()) continue
        if (bullets.some((existing) => existing.toLowerCase() === b.toLowerCase())) continue
        bullets.push(b)
      }

      const lines: string[] = []
      if (title) lines.push(`### **${title}**`)
      if (url) lines.push(url)
      if (tech.length) lines.push(tech.slice(0, 6).join(', '))
      for (const b of bullets.slice(0, 3)) lines.push(`* ${b}`)

      return lines.join('\n').trim()
    }

    const buildLatestProjectsBlocks = (): string => {
      if (!topProjects.length) return ''
      return topProjects.map(formatLatestProjectBlock).filter(Boolean).join('\n\n')
    }

    const latestProjectsBlocks = buildLatestProjectsBlocks()

    const pickTopCertifications = (): typeof certDocs => {
      const allCerts = certDocs
      if (!allCerts.length) return []

      const selectedIds = Array.isArray(selected?.certificationIds)
        ? selected.certificationIds.map((id) => String(id).trim()).filter(Boolean)
        : []

      const byId = new Map<string, (typeof allCerts)[number]>()
      for (const c of allCerts) {
        const id = c?.id != null ? String(c.id) : ''
        if (id) byId.set(id, c)
      }

      const parseTime = (input?: string): number => {
        const t = (input ?? '').trim()
        if (!t) return 0
        const ms = new Date(t).getTime()
        return Number.isFinite(ms) ? ms : 0
      }

      const sortByLatest = (a: (typeof allCerts)[number], b: (typeof allCerts)[number]): number => {
        const diff = parseTime(b?.issueDate) - parseTime(a?.issueDate)
        if (diff) return diff
        const ao = typeof a?.order === 'number' ? a.order : 0
        const bo = typeof b?.order === 'number' ? b.order : 0
        if (ao !== bo) return ao - bo
        const at = (a?.title ?? '').trim().toLowerCase()
        const bt = (b?.title ?? '').trim().toLowerCase()
        return at.localeCompare(bt)
      }

      const tokenize = (input: string): string[] => {
        return (input ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9+#.\-\s]/g, ' ')
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
      }

      const stopwords = new Set([
        'the',
        'and',
        'or',
        'to',
        'of',
        'in',
        'for',
        'with',
        'on',
        'at',
        'as',
        'a',
        'an',
        'by',
        'is',
        'are',
        'be',
        'will',
        'you',
        'we',
        'our',
        'your',
        'this',
        'that',
        'from',
        'into',
        'across',
        'using',
        'use',
        'used',
        'job',
        'role',
        'work',
        'working',
        'team',
        'teams',
        'years',
        'year',
        'experience',
        'skill',
        'skills',
        'required',
        'requirements',
        'preferred',
        'plus',
        'responsibilities',
        'responsibility',
        'ability',
        'abilities',
        'strong',
        'knowledge',
        'understanding',
        'including',
        'include',
        'must',
        'nice',
        'good',
        'training',
        'learning',
        'course',
        'courses',
        'certificate',
        'certification',
        'certifications',
        'essential',
        'basics',
        'fundamentals',
        'intro',
        'introduction',
      ])

      const buildJobKeywords = (): Set<string> => {
        const raw = [jobAd.title ?? '', jdText].join(' ')

        const techFromRaw = new Set<string>()
        for (const match of raw.matchAll(/\b[A-Z][A-Za-z0-9.+#\-]{1,}\b/g)) {
          const v = (match?.[0] ?? '').trim().toLowerCase()
          if (v && !stopwords.has(v)) techFromRaw.add(v)
        }
        for (const match of raw.matchAll(/\b[a-z0-9]+\.[a-z0-9.\-]+\b/gi)) {
          const v = (match?.[0] ?? '').trim().toLowerCase()
          if (v && !stopwords.has(v)) techFromRaw.add(v)
        }

        const tokens = tokenize(raw)
        const out = new Set<string>()
        for (const t of tokens) {
          if (stopwords.has(t)) continue
          if (t.length >= 3) out.add(t)
          if (t === 'ai' || t === 'ml') out.add(t)
        }

        for (const t of techFromRaw) out.add(t)

        const normalized = raw.toLowerCase()
        if (normalized.includes('artificial intelligence')) out.add('ai')
        if (normalized.includes('machine learning')) out.add('ml')
        if (
          normalized.includes('large language model') ||
          normalized.includes('large-language model')
        )
          out.add('llm')
        if (normalized.includes('generative ai') || normalized.includes('genai')) out.add('genai')

        return out
      }

      const jobKeywords = buildJobKeywords()

      const techKeywordSet = new Set(
        Array.from(jobKeywords).filter(
          (kw) => /[.+#\-]/.test(kw) || /\d/.test(kw) || kw.length >= 6,
        ),
      )

      const primaryStackKeywords = new Set([
        'python',
        'django',
        'drf',
        'rest',
        'api',
        'apis',
        'restful',
        'php',
        'laravel',
        'wordpress',
        'node',
        'node.js',
        'react',
        'react.js',
        'vue',
        'vue.js',
        'nuxt',
        'nuxt.js',
        'next',
        'next.js',
        'typescript',
        'javascript',
        'express',
        'graphql',
        'htmx',
        'tailwind',
        'tailwindcss',
        'postgres',
        'postgresql',
        'mysql',
        'docker',
        'git',
        'github',
        'github-actions',
        'aws',
        'gcp',
        'kubernetes',
      ])

      const scoreCert = (
        c: (typeof allCerts)[number],
      ): { tech: number; general: number; total: number } => {
        const titleTokens = new Set(tokenize((c?.title ?? '').trim()))
        const issuerTokens = new Set(tokenize((c?.issuer ?? '').trim()))

        const matchesKw = (tokenSet: Set<string>, kw: string): boolean => {
          if (tokenSet.has(kw)) return true
          for (const tok of tokenSet) {
            if (tok.startsWith(`${kw}.`) || tok.startsWith(`${kw}-`)) return true
            if (kw.startsWith(`${tok}.`) || kw.startsWith(`${tok}-`)) return true
          }
          return false
        }

        let tech = 0
        let general = 0
        for (const kw of jobKeywords) {
          if (kw === 'ai' && titleTokens.has('training')) continue
          const isTech = techKeywordSet.has(kw)

          const matchTitle = matchesKw(titleTokens, kw)
          const matchIssuer = matchesKw(issuerTokens, kw)
          if (!matchTitle && !matchIssuer) continue

          const isPrimary = primaryStackKeywords.has(kw)
          if (isPrimary) {
            if (matchTitle) tech += isTech ? 10 : 6
            if (matchIssuer) tech += isTech ? 4 : 2
          } else {
            if (matchTitle) general += isTech ? 4 : 1
            if (matchIssuer) general += isTech ? 2 : 1
          }
        }

        return { tech, general, total: tech + general }
      }
      const selectedIdSet = new Set(selectedIds)

      const scoredAll = allCerts.map((doc) => {
        const id = doc?.id != null ? String(doc.id) : ''
        const parts = scoreCert(doc)
        const base = parts.total
        const bonus = id && selectedIdSet.has(id) ? 1 : 0
        return { doc, score: base + bonus, base, tech: parts.tech }
      })

      const hasPrimaryMatches = scoredAll.some((c) => c.tech > 0)
      const eligible = hasPrimaryMatches
        ? scoredAll.filter((c) => c.tech > 0)
        : scoredAll.filter((c) => c.base > 0)

      if (eligible.length) {
        return eligible
          .slice()
          .sort((a, b) => {
            if (hasPrimaryMatches && b.tech !== a.tech) return b.tech - a.tech
            if (b.score !== a.score) return b.score - a.score
            return sortByLatest(a.doc, b.doc)
          })
          .map((c) => c.doc)
          .slice(0, 5)
      }

      const selectedDocs = selectedIds
        .map((id) => byId.get(id))
        .filter((c): c is (typeof allCerts)[number] => Boolean(c))
        .slice(0, 5)

      if (selectedDocs.length) return selectedDocs

      return allCerts.slice().sort(sortByLatest).slice(0, 5)
    }

    const topCertifications = pickTopCertifications()

    const normalizeCertificationUrl = (input: string): string => {
      const t = (input ?? '').trim()
      if (!t) return ''
      return t
    }

    const formatCertificationBlock = (cert: {
      title?: string
      issuer?: string
      duration?: string
      issueDate?: string
      credentialUrl?: string
    }): string => {
      const formatCertIssueDate = (value: unknown): string => {
        if (!value) return ''
        const d = value instanceof Date ? value : new Date(String(value))
        if (Number.isNaN(d.getTime())) return ''

        const long = new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(d)

        return long
      }

      const title = (cert.title ?? '').trim()
      const credentialUrl = normalizeCertificationUrl(cert.credentialUrl ?? '')
      const duration = (cert.duration ?? '').trim()
      const issueDate = formatCertIssueDate(cert.issueDate)

      const issuerRaw = (cert.issuer ?? '').trim()
      const issuer = (() => {
        const issuerLower = issuerRaw.toLowerCase()
        const urlLower = credentialUrl.toLowerCase()

        if (
          urlLower.includes('linkedin.com/learning') ||
          issuerLower === 'linkedin learning' ||
          issuerLower === 'linkedin.com'
        ) {
          return 'LinkedIn Learning'
        }

        if (urlLower.includes('udemy.com') || issuerLower.includes('udemy')) {
          return 'Udemy'
        }

        return issuerRaw
      })()

      const metaParts: string[] = []
      if (issuer) metaParts.push(`From ${issuer}`)
      if (duration) metaParts.push(`it took me ${duration}`)
      if (issueDate) metaParts.push(`last ${issueDate}`)
      const metaLine = metaParts.join(', ').trim()

      const lines: string[] = []
      if (title) lines.push(`### **${title}**`)
      if (metaLine) lines.push(metaLine)
      if (credentialUrl) lines.push(credentialUrl)
      return lines.join('\n').trim()
    }

    const certificationBlocks = topCertifications
      .map(formatCertificationBlock)
      .filter(Boolean)
      .join('\n\n')

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

    const formatEducationBlock = (edu: {
      degree?: string
      fieldOfStudy?: string
      school?: string
      location?: string
      startDate?: string
      endDate?: string
    }): string => {
      const degreePart = (edu.degree ?? '').trim()
      const field = (edu.fieldOfStudy ?? '').trim()
      const degreeLine = joinNonEmpty([degreePart, field ? `${field}` : ''], ' ')
      const school = (edu.school ?? '').trim()
      const location = (edu.location ?? '').trim()
      const schoolLine = joinNonEmpty([school, location], ' - ')
      const start = formatMonthYear(edu.startDate)
      const end = formatMonthYear(edu.endDate)
      const dateLine = joinNonEmpty([start, end], ' to ')

      const lines: string[] = []
      if (degreeLine) lines.push(`**${degreeLine}**`)
      if (schoolLine) lines.push(schoolLine)
      if (dateLine) lines.push(dateLine)
      return lines.join('\n').trim()
    }

    const educationBlocks = (Array.isArray(educations.docs) ? educations.docs : [])
      .map(formatEducationBlock)
      .filter(Boolean)
      .join('\n\n')

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
      educationBlocks,
      certificationBlocks,
      address: resumeProfileGlobal.address ?? '',
      email: resumeProfileGlobal.email ?? '',
      phone: resumeProfileGlobal.phone ?? '',
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      latestProjectsBlocks,
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

    const cleanupApplicationLetter = (input: string): string => {
      let out = String(input ?? '')

      out = out.replace(/^\s*Header\s*:\s*(?:\r?\n)+/i, '')
      out = out.replace(/^(?:\r?\n)+/, '')

      return out.trim()
    }

    const applicationLetterRaw = await openAIChat({
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

    const applicationLetter = cleanupApplicationLetter(applicationLetterRaw)

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
