import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload, PayloadRequest, Where } from 'payload'

type ExperienceSeed = {
  title: string
  company: string
  description?: string
  startDate: string
  endDate?: string
  current?: boolean
  highlights?: string[]
}

type ProjectSeed = {
  title: string
  slug: string
  summary?: string
  repoUrl?: string
  liveUrl?: string
  techStack?: string[]
  publishedAt?: string
  category?: string
}

type CertificationSeed = {
  title: string
  issuer?: string
  duration?: string
  issueDate?: string
  credentialUrl?: string
  category?: string
}

const toISODate = (value: string): string => {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

const formatSlug = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const unescapeMarkdownText = (input: string): string => {
  return input.replace(/\\([\\`*_{}\[\]()#+\-.!|>])/g, '$1')
}

const parseMarkdownUrl = (line: string): string | undefined => {
  const md = line.match(/\((https?:\/\/[^)]+)\)/)
  if (md?.[1]) return md[1]

  const plain = line.match(/(https?:\/\/\S+)/)
  if (!plain?.[1]) return undefined
  return plain[1].replace(/[),.]+$/, '')
}

const parseResumeProjects = (resumeText: string): ProjectSeed[] => {
  const lines = resumeText.split(/\r?\n/)
  const startIndex = lines.findIndex((l) => l.includes('| Latest Projects'))
  if (startIndex === -1) return []

  const endIndex = lines.findIndex(
    (l, idx) =>
      idx > startIndex &&
      (l.includes('| Latest Skills with Certifications') ||
        l.includes('**Graphic Design Projects')),
  )

  const slice = lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex)

  const projects: Array<{ title: string; repoUrl?: string; summary?: string }> = []
  let i = 0

  while (i < slice.length) {
    const line = slice[i].trim()
    const titleMatch = line.match(/^\*\*(.+?)\*\*\s*$/)
    if (!titleMatch) {
      i += 1
      continue
    }

    const title = unescapeMarkdownText(titleMatch[1].trim())
    i += 1

    let repoUrl: string | undefined
    if (i < slice.length) {
      repoUrl = parseMarkdownUrl(slice[i].trim())
      if (repoUrl) i += 1
    }

    const descLines: string[] = []
    while (i < slice.length) {
      const t = slice[i].trim()
      if (t.match(/^\*\*.+\*\*\s*$/)) break
      if (t.length > 0) descLines.push(t)
      i += 1
    }

    const summaryRaw = descLines.join(' ').replace(/\s+/g, ' ').trim()
    const summary = summaryRaw.length > 0 ? unescapeMarkdownText(summaryRaw) : undefined
    projects.push({ title, repoUrl, summary })
  }

  const seen = new Map<string, number>()
  const result = projects
    .map((p) => {
      const baseSlug = formatSlug(p.title)
      const count = (seen.get(baseSlug) ?? 0) + 1
      seen.set(baseSlug, count)
      const slug = count === 1 ? baseSlug : `${baseSlug}-${count}`
      return {
        title: p.title,
        slug,
        repoUrl: p.repoUrl,
        summary: p.summary,
      } satisfies ProjectSeed
    })
    .filter((p) => p.slug.length > 0)

  return result
}

const parseResumeCertifications = (resumeText: string): CertificationSeed[] => {
  const lines = resumeText.split(/\r?\n/)
  const startIndex = lines.findIndex((l) => l.includes('| Latest Skills with Certifications'))
  if (startIndex === -1) return []

  const slice = lines.slice(startIndex + 1)
  const certs: CertificationSeed[] = []

  let i = 0
  while (i < slice.length) {
    const line = slice[i].trim()
    const titleMatch = line.match(/^\*\*(.+?)\*\*\s*$/)
    if (!titleMatch) {
      i += 1
      continue
    }

    const title = unescapeMarkdownText(titleMatch[1].trim())
    i += 1

    let issuer: string | undefined
    let duration: string | undefined
    let issueDate: string | undefined
    let credentialUrl: string | undefined

    while (i < slice.length) {
      const t = slice[i].trim()
      if (t.match(/^\*\*.+\*\*\s*$/)) break

      const providerMatch = t.match(/^Provider:\s*(.+?)\s*$/)
      if (providerMatch?.[1]) issuer = unescapeMarkdownText(providerMatch[1])

      const issuedMatch = t.match(/^Issued:\s*(.+?)\s*$/)
      if (issuedMatch?.[1]) issueDate = toISODate(issuedMatch[1])

      const timeMatch = t.match(/^Time:\s*(.+?)\s*$/)
      if (timeMatch?.[1]) duration = unescapeMarkdownText(timeMatch[1])

      if (!credentialUrl) {
        const url = parseMarkdownUrl(t)
        if (url) credentialUrl = url
      }

      i += 1
    }

    certs.push({ title, issuer, duration, issueDate, credentialUrl })
  }

  return certs
}

const findExistingID = async ({
  payload,
  req,
  collection,
  where,
  overrideAccess,
}: {
  payload: Payload
  req: PayloadRequest
  collection: 'experiences' | 'projects' | 'certifications'
  where: Where
  overrideAccess: boolean
}): Promise<string | number | null> => {
  const existing = await payload.find({
    collection,
    where,
    depth: 0,
    limit: 1,
    overrideAccess,
    req,
  })

  return existing.docs?.[0]?.id ?? null
}

const upsertExperience = async ({
  payload,
  req,
  item,
  overrideAccess,
}: {
  payload: Payload
  req: PayloadRequest
  item: ExperienceSeed
  overrideAccess: boolean
}): Promise<void> => {
  const existingID = await findExistingID({
    payload,
    req,
    collection: 'experiences',
    where: {
      and: [
        { title: { equals: item.title } },
        { company: { equals: item.company } },
        { startDate: { equals: item.startDate } },
      ],
    },
    overrideAccess,
  })

  const data = {
    title: item.title,
    company: item.company,
    startDate: item.startDate,
    endDate: item.endDate,
    current: item.current ?? false,
    highlights: (item.highlights ?? []).map((text) => ({ text })),
    publishedAt: toISODate(item.startDate),
    _status: 'published' as const,
  }

  if (existingID) {
    await payload.update({
      collection: 'experiences',
      id: existingID,
      data,
      depth: 0,
      overrideAccess,
      req,
    })
    return
  }

  await payload.create({
    collection: 'experiences',
    data,
    depth: 0,
    overrideAccess,
    req,
  })
}

const upsertProject = async ({
  payload,
  req,
  item,
  overrideAccess,
}: {
  payload: Payload
  req: PayloadRequest
  item: ProjectSeed
  overrideAccess: boolean
}): Promise<void> => {
  const existing = await payload.find({
    collection: 'projects',
    where: { slug: { equals: item.slug } },
    depth: 0,
    limit: 1,
    overrideAccess,
    req,
  })

  const existingDoc = existing.docs?.[0] as
    | undefined
    | { id: string | number; publishedAt?: string }
  const existingID = existingDoc?.id
  const publishedAt = existingDoc?.publishedAt ?? item.publishedAt ?? new Date().toISOString()

  const data = {
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    repoUrl: item.repoUrl,
    liveUrl: item.liveUrl,
    category: (item.category ?? 'full-stack') as
      | 'full-stack'
      | 'wordpress'
      | 'automation'
      | 'graphic-design',
    featured: false,
    techStack: (item.techStack ?? []).map((name) => ({ name })),
    publishedAt,
    _status: 'published' as const,
  }

  if (existingID) {
    await payload.update({
      collection: 'projects',
      id: existingID,
      data,
      depth: 0,
      overrideAccess,
      req,
    })
    return
  }

  await payload.create({
    collection: 'projects',
    data,
    depth: 0,
    overrideAccess,
    req,
    draft: false,
  })
}

const upsertCertification = async ({
  payload,
  req,
  item,
  overrideAccess,
}: {
  payload: Payload
  req: PayloadRequest
  item: CertificationSeed
  overrideAccess: boolean
}): Promise<void> => {
  const existingID = item.credentialUrl
    ? await findExistingID({
        payload,
        req,
        collection: 'certifications',
        where: { credentialUrl: { equals: item.credentialUrl } },
        overrideAccess,
      })
    : await findExistingID({
        payload,
        req,
        collection: 'certifications',
        where: {
          and: [
            { title: { equals: item.title } },
            ...(item.issuer ? [{ issuer: { equals: item.issuer } }] : []),
          ],
        },
        overrideAccess,
      })

  const data = {
    title: item.title,
    issuer: item.issuer,
    duration: item.duration,
    issueDate: item.issueDate,
    credentialUrl: item.credentialUrl,
    category: (item.category ?? 'general-dev') as
      | 'frontend-javascript'
      | 'laravel-backend'
      | 'python-django'
      | 'wordpress'
      | 'ai-ml'
      | 'cloud-devops'
      | 'git-collaboration'
      | 'video-creative'
      | 'general-dev',
    publishedAt: item.issueDate ?? new Date().toISOString(),
    _status: 'published' as const,
  }

  if (existingID) {
    await payload.update({
      collection: 'certifications',
      id: existingID,
      data,
      depth: 0,
      overrideAccess,
      req,
    })
    return
  }

  await payload.create({
    collection: 'certifications',
    data,
    depth: 0,
    overrideAccess,
    req,
    draft: false,
  })
}

export const seedResume = async ({
  payload,
  req,
  overrideAccess = false,
}: {
  payload: Payload
  req: PayloadRequest
  overrideAccess?: boolean
}): Promise<void> => {
  const resumePath = path.resolve(process.cwd(), 'resume.txt')
  const resumeText = await readFile(resumePath, 'utf8')

  const experiences: ExperienceSeed[] = [
    {
      title: 'Final Weigher',
      company: 'Union Leaf Tobacco Corporation',
      description: 'A tobacco company based in the Philippines.',
      startDate: '2003-03-01T00:00:00.000Z',
      endDate: '2004-06-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Ensured all packed tobacco met exact weight requirements before transferring to the warehouse.',
        'Provided technical support to production clerks, resolving computer-related issues to maintain operational efficiency.',
      ],
    },
    {
      title: 'High School Math Instructor',
      company: 'Agoo Academy',
      description: 'A school in La Union, Philippines.',
      startDate: '2004-06-01T00:00:00.000Z',
      endDate: '2005-03-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Taught mathematics subjects, including Geometry, Algebra, Statistics, and Trigonometry, to high school students.',
        'Served as a general section adviser and part-time computer instructor, teaching basic IT skills.',
      ],
    },
    {
      title: 'Web/Graphic Designer and Customer Representative',
      company: 'Web Coast Design Inc.',
      description:
        'A website design and development company serving clients across the United States.',
      startDate: '2005-03-01T00:00:00.000Z',
      endDate: '2006-04-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Collaborated with clients to design and develop custom websites that aligned with their business goals.',
        'Worked closely with senior designers to learn and apply advanced web and graphic design techniques.',
      ],
    },
    {
      title: 'Web Developer and Graphic Artist',
      company: 'Danalex Graphic Arts and Call Center',
      description:
        'A Graphic Arts, Web Design, and Software Development Company originally based in Honolulu, Hawaii, and Las Vegas.',
      startDate: '2006-04-01T00:00:00.000Z',
      endDate: '2007-07-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Developed websites using PHP, MySQL, XHTML, and CSS, ensuring functionality and adherence to client requirements.',
        'Designed and converted website mockups from Photoshop into working front-end interfaces.',
      ],
    },
    {
      title: 'Freelance Graphic Designer',
      company: 'Thunderbird Resort La Union Philippines',
      description: 'A Mediterranean-inspired luxury resort in the northern Philippines.',
      startDate: '2007-05-01T00:00:00.000Z',
      endDate: '2008-11-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Created graphic designs for promotional materials such as tarpaulins, brochures, and magazines, aligning visuals with the resort’s premium branding.',
      ],
    },
    {
      title: 'Senior Web Programmer and Web Designer',
      company: 'PulseIQ.com',
      description: 'A smart energy management solution for multifamily buildings.',
      startDate: '2007-07-01T00:00:00.000Z',
      current: true,
      highlights: [
        'Lead the design and development of all partner websites, building custom WordPress and Elementor-based solutions tailored for high-impact marketing campaigns.',
        'Develop custom WordPress plugins and implement fully responsive themes from scratch, converting Photoshop designs into pixel-perfect front-end templates.',
        'Create visual branding materials, including logos, images, and videos, using Adobe Photoshop and Premiere Pro.',
        'Utilize AI content generation tools (ChatGPT, Gemini) to create SEO-friendly web copy, significantly reducing content production time while maintaining quality.',
        'Build automation pipelines using Zapier and Make.com, integrating Google Sheets, OpenAI, and WordPress, reducing manual tasks and improving productivity by up to 80%.',
        'Execute SEO strategies with Google Tag Manager, ensuring optimal search visibility and tracking.',
        'Act as a trainer and content creator for online tutorials, educating partner teams on CMS and digital marketing processes.',
        'Design Python-based data extraction and automation tools (Playwright, Selenium, Tkinter), enabling efficient collection of large datasets for marketing analytics.',
      ],
    },
    {
      title: 'Web Designer',
      company: 'SiteBuilder123.com',
      description: 'A small, experienced team specializing in website development and marketing.',
      startDate: '2015-02-01T00:00:00.000Z',
      endDate: '2015-12-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Built WordPress websites tailored to client requirements, focusing on modern, responsive design.',
        'Designed marketing materials like tarpaulins, brochures, and streamers, helping clients effectively communicate their brand messages.',
      ],
    },
    {
      title: 'Lead Banner Designer – Contractual',
      company: 'Bowzed.com',
      description: 'Helps companies of all sizes acquire customers affordably and efficiently.',
      startDate: '2015-03-01T00:00:00.000Z',
      endDate: '2015-05-01T00:00:00.000Z',
      current: false,
      highlights: [
        'Designed and coded marketing banners using HTML, CSS, and JavaScript, ensuring responsive and engaging designs.',
      ],
    },
    {
      title: 'Web Developer',
      company: 'LogicMedia BV',
      description: 'An online marketing agency.',
      startDate: '2015-06-01T00:00:00.000Z',
      current: true,
      highlights: [
        'Partner directly with the CEO to lead end-to-end web development initiatives, delivering high-performance marketing and interstitial websites that drive engagement and conversions.',
        'Develop full-stack tools and applications using Python, Django, React.js, and Next.js, streamlining internal workflows and improving operational efficiency.',
        'Spearhead domain, hosting, and CDN configurations (Cloudflare), optimizing site performance, security, and uptime.',
        'Write high-impact marketing content for landing pages and promotional websites, leveraging AI-powered prompt engineering for maximum conversion.',
        'Produce training documentation, video tutorials, and marketing content, including YouTube video editing and uploads, supporting cross-department needs.',
        'Act as a multi-functional resource—from developer to virtual assistant—helping the company achieve cost and time savings by consolidating multiple roles into one.',
      ],
    },
  ]

  const parsedProjects = parseResumeProjects(resumeText)
  const parsedCertifications = parseResumeCertifications(resumeText)

  const projects = [...parsedProjects].reverse().map((p, idx, arr) => {
    const base = Date.now() - (arr.length - 1 - idx) * 1000
    return {
      ...p,
      publishedAt: new Date(base).toISOString(),
    } satisfies ProjectSeed
  })

  const certifications = [...parsedCertifications]
    .sort((a, b) => {
      const at = a.issueDate ? new Date(a.issueDate).getTime() : 0
      const bt = b.issueDate ? new Date(b.issueDate).getTime() : 0
      return at - bt
    })
    .filter((c) => c.title.trim().length > 0)

  for (const item of experiences) {
    await upsertExperience({ payload, req, item, overrideAccess })
  }

  for (const item of projects) {
    await upsertProject({ payload, req, item, overrideAccess })
  }

  for (let i = 0; i < certifications.length; i += 10) {
    const batch = certifications.slice(i, i + 10)
    await Promise.all(
      batch.map((item) => upsertCertification({ payload, req, item, overrideAccess })),
    )
  }
}
