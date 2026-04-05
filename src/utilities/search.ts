import type { Certification, Experience, Project } from '@/payload-types'

export interface SearchFilters {
  type?: 'all' | 'experience' | 'projects' | 'certifications'
  limit?: number
}

export interface SearchResult {
  type: 'experience' | 'project' | 'certification'
  id: string
  title: string
  subtitle: string
  description: string
  date?: string
  tags?: string[]
  url?: string
  liveUrl?: string
  repoUrl?: string
  certificateUrl?: string
  relevanceScore: number
  matchedFields: string[]
}

export interface SearchResponse {
  query: string
  totalResults: number
  results: {
    experiences: SearchResult[]
    projects: SearchResult[]
    certifications: SearchResult[]
  }
  counts: {
    experiences: number
    projects: number
    certifications: number
  }
}

/**
 * Extract keywords from search query with common variations
 */
export function extractKeywords(query: string): string[] {
  const keywords = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  // Handle common variations for better matching
  const expandedKeywords: string[] = []

  keywords.forEach((keyword) => {
    expandedKeywords.push(keyword)

    // Add common variations for AI
    if (keyword === 'ai') {
      expandedKeywords.push('artificial intelligence')
    }

    // Add variations for ML
    if (keyword === 'ml') {
      expandedKeywords.push('machine learning')
    }

    // Handle hyphenated terms
    if (keyword.includes('-')) {
      const parts = keyword.split('-')
      expandedKeywords.push(...parts)
      expandedKeywords.push(parts.join(' '))
    }
  })

  return [...new Set(expandedKeywords)] // Remove duplicates
}

/**
 * Check if text contains any of the keywords as whole words
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  if (!text) return false
  const lowerText = text.toLowerCase()

  return keywords.some((keyword) => {
    // Special handling for AI to avoid false positives
    if (keyword === 'ai') {
      // Only match "AI" as standalone word or in "Artificial Intelligence"
      const aiRegex = /\bai\b/i
      const artificialIntelligenceRegex = /artificial\s+intelligence/i
      return aiRegex.test(lowerText) || artificialIntelligenceRegex.test(lowerText)
    }

    // For other keywords, use standard word boundary matching
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(lowerText)
  })
}

/**
 * Calculate relevance score for a search result
 * Higher score = more relevant
 */
export function calculateRelevanceScore(
  item: Experience | Project | Certification,
  keywords: string[],
  type: 'experience' | 'project' | 'certification',
): number {
  let score = 0

  if (type === 'experience') {
    const exp = item as Experience
    // Title match (highest priority)
    if (exp.title && containsKeywords(exp.title, keywords)) score += 10
    // Company match
    if (exp.company && containsKeywords(exp.company, keywords)) score += 8
    // Highlights match (array of text objects)
    if (exp.highlights) {
      const highlightsText = exp.highlights.map((h) => h.text).join(' ')
      if (containsKeywords(highlightsText, keywords)) score += 7
    }
  } else if (type === 'project') {
    const proj = item as Project
    // Title match (highest priority)
    if (proj.title && containsKeywords(proj.title, keywords)) score += 10
    // Tech stack match (high priority) - array of objects with name
    if (proj.techStack) {
      const techStackText = proj.techStack.map((t) => t.name).join(' ')
      if (containsKeywords(techStackText, keywords)) score += 9
    }
    // Summary match
    if (proj.summary && containsKeywords(proj.summary, keywords)) score += 6
    // Category match
    if (proj.category && containsKeywords(proj.category, keywords)) score += 4
  } else if (type === 'certification') {
    const cert = item as Certification
    // Title match (highest priority)
    if (cert.title && containsKeywords(cert.title, keywords)) score += 10
    // Category match
    if (cert.category && containsKeywords(cert.category, keywords)) score += 8
    // Issuer match
    if (cert.issuer && containsKeywords(cert.issuer, keywords)) score += 7
  }

  return score
}

/**
 * Highlight matched keywords in text
 */
export function highlightMatches(text: string, keywords: string[]): string {
  if (!text || keywords.length === 0) return text

  let highlightedText = text

  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
  })

  return highlightedText
}

/**
 * Get popular search terms
 */
export function getPopularSearches(): string[] {
  return ['React', 'Next.js', 'Laravel', 'WordPress', 'Python', 'AI', 'TypeScript', 'Open AI']
}

/**
 * Format experience as search result
 */
export function formatExperienceResult(exp: Experience, keywords: string[]): SearchResult {
  const relevanceScore = calculateRelevanceScore(exp, keywords, 'experience')
  const matchedFields: string[] = []

  if (exp.title && containsKeywords(exp.title, keywords)) matchedFields.push('title')
  if (exp.company && containsKeywords(exp.company, keywords)) matchedFields.push('company')

  const highlightsText = exp.highlights?.map((h) => h.text).join(' ') || ''
  if (highlightsText && containsKeywords(highlightsText, keywords)) matchedFields.push('highlights')

  return {
    type: 'experience',
    id: String(exp.id),
    title: exp.title || '',
    subtitle: exp.company || '',
    description: highlightsText || '',
    date: formatDateRange(exp.startDate, exp.endDate),
    tags: exp.location ? [exp.location] : [],
    relevanceScore,
    matchedFields,
  }
}

/**
 * Format project as search result
 */
export function formatProjectResult(project: Project, keywords: string[]): SearchResult {
  const relevanceScore = calculateRelevanceScore(project, keywords, 'project')
  const matchedFields: string[] = []

  if (containsKeywords(project.title || '', keywords)) matchedFields.push('title')
  if (containsKeywords(project.summary || '', keywords)) matchedFields.push('summary')
  if (containsKeywords(project.category || '', keywords)) matchedFields.push('category')

  return {
    type: 'project',
    id: String(project.id),
    title: project.title || 'Untitled Project',
    subtitle: project.category || 'Project',
    description: project.summary || '',
    date: project.publishedAt || '',
    tags: project.techStack?.map((t) => t.name) || [],
    url: project.liveUrl || project.repoUrl || undefined,
    liveUrl: project.liveUrl || undefined,
    repoUrl: project.repoUrl || undefined,
    relevanceScore,
    matchedFields,
  }
}

/**
 * Format certification as search result
 */
export function formatCertificationResult(cert: Certification, keywords: string[]): SearchResult {
  const relevanceScore = calculateRelevanceScore(cert, keywords, 'certification')
  const matchedFields: string[] = []

  if (cert.title && containsKeywords(cert.title, keywords)) matchedFields.push('title')
  if (cert.category && containsKeywords(cert.category, keywords)) matchedFields.push('category')
  if (cert.issuer && containsKeywords(cert.issuer, keywords)) matchedFields.push('issuer')

  return {
    type: 'certification',
    id: cert.id.toString(),
    title: cert.title || '',
    subtitle: cert.issuer || '',
    description: cert.duration || '',
    date: cert.issueDate || '',
    tags: cert.category ? [cert.category] : [],
    url: cert.credentialUrl || undefined,
    certificateUrl: cert.credentialUrl || undefined,
    relevanceScore,
    matchedFields,
  }
}

/**
 * Format date range for display
 */
function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return ''

  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  if (!endDate) return `${start} - Present`

  const end = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return `${start} - ${end}`
}
