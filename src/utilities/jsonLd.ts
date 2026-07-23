import type { Project, Certification, ResumeProfile1, SiteSetting } from '@/payload-types'
import { getCanonicalURL } from './getURL'

/**
 * Generate Person schema for homepage
 */
export function generatePersonSchema(profile: ResumeProfile1 | null, settings: SiteSetting | null) {
  const baseUrl = getCanonicalURL()

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile?.fullName || settings?.siteName || '',
    jobTitle: profile?.headline || '',
    url: baseUrl,
    sameAs: settings?.socialLinks?.map((link) => link.url).filter(Boolean) || [],
  }

  // knowsAbout gives search and answer engines an explicit competency list
  // instead of making them infer one from prose. This is the cheapest lever for
  // entity resolution — it's what lets an LLM answer "who is Ronald Allan
  // Rivera and what does he do" with confidence rather than a guess.
  schema.knowsAbout = [
    'Full-Stack Web Development',
    'Python',
    'Django',
    'Laravel',
    'PHP',
    'React',
    'Next.js',
    'TypeScript',
    'WordPress Plugin Development',
    'AI Automation',
    'API Design',
    'DevOps',
  ]

  if (profile?.summary) {
    schema.description = profile.summary
  }

  // Add email if available
  if (profile?.email) {
    schema.email = profile.email
  }

  return schema
}

/**
 * Generate WebSite schema
 */
export function generateWebSiteSchema(settings: SiteSetting | null) {
  const baseUrl = getCanonicalURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings?.siteName || '',
    description: settings?.defaultMetaDescription || '',
    url: baseUrl,
  }
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: url,
  }
}

/**
 * Generate SoftwareApplication or CreativeWork schema for projects
 */
export function generateProjectSchema(project: Project) {
  const baseUrl = getCanonicalURL()

  // Determine if it's a software project or creative work
  const isSoftware =
    project.category === 'full-stack' ||
    project.category === 'wordpress' ||
    project.category === 'automation'

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isSoftware ? 'SoftwareApplication' : 'CreativeWork',
    name: project.title,
    description: project.summary || '',
    url: `${baseUrl}/project/${project.slug}`,
  }

  // Add tech stack as keywords
  if (project.techStack && project.techStack.length > 0) {
    schema.keywords = project.techStack.map((tech) => tech.name).join(', ')
  }

  // Add URLs if available
  if (project.liveUrl) {
    schema.url = project.liveUrl
  }

  if (project.repoUrl) {
    schema.codeRepository = project.repoUrl
  }

  // Add category
  if (project.category) {
    schema.applicationCategory = project.category
  }

  return schema
}

/**
 * Generate EducationalOccupationalCredential schema for certifications
 */
export function generateCertificationSchema(cert: Certification) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: cert.title,
    credentialCategory: 'certificate',
  }

  if (cert.issuer) {
    schema.recognizedBy = {
      '@type': 'Organization',
      name: cert.issuer,
    }
  }

  if (cert.issueDate) {
    schema.dateCreated = cert.issueDate
  }

  if (cert.credentialUrl) {
    schema.url = cert.credentialUrl
  }

  return schema
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Serialize JSON-LD data for use in script tag
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
}
