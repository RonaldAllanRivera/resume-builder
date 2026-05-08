'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Certification, SiteSetting } from '@/payload-types'
import { CTAButtons } from './components/CTAButtons'
import { SearchBar } from './components/search/SearchBar'
import { HeroReveal } from './components/HeroReveal'
import { ScrollReveal } from './components/ScrollReveal'
import {
  techStackIcons,
  getDynamicIconPosition,
  extractTechFromCertificationTitle,
  getFallbackIcons,
} from '@/utilities/techStackIcons'

interface AllCertificationsPageProps {
  certifications?: Certification[]
  settings?: SiteSetting | null
}

const gradients = [
  'from-emerald-400 via-cyan-400 to-blue-500',
  'from-rose-400 via-orange-300 to-amber-300',
  'from-orange-400 via-yellow-300 to-lime-300',
  'from-fuchsia-400 via-pink-300 to-rose-300',
  'from-sky-400 via-indigo-300 to-violet-400',
  'from-cyan-400 via-teal-300 to-emerald-300',
  'from-violet-400 via-purple-300 to-indigo-400',
  'from-pink-400 via-fuchsia-300 to-purple-400',
  'from-blue-400 via-sky-300 to-cyan-300',
  'from-indigo-400 via-blue-300 to-cyan-300',
  'from-amber-300 via-yellow-300 to-orange-400',
]

const categoryLabels: Record<string, string> = {
  'frontend-javascript': 'Frontend & JavaScript',
  'laravel-backend': 'Laravel & Backend',
  'python-django': 'Python & Django',
  wordpress: 'WordPress',
  'ai-ml': 'AI & Machine Learning',
  'cloud-devops': 'Cloud, DevOps & Architecture',
  'git-collaboration': 'Git & Collaboration',
  'video-creative': 'Video & Creative',
  'general-dev': 'General Development',
}

const categoryDescriptions: Record<string, string> = {
  'frontend-javascript':
    'Modern frontend frameworks and JavaScript technologies including React, Vue, Next.js, and TypeScript.',
  'laravel-backend':
    'Backend development with Laravel, PHP, and API design for scalable web applications.',
  'python-django':
    'Python programming and Django framework for building robust web applications and automation tools.',
  wordpress: 'WordPress development, custom plugins, themes, and content management solutions.',
  'ai-ml':
    'Artificial Intelligence and Machine Learning fundamentals, applications, and practical implementations.',
  'cloud-devops':
    'Cloud platforms, DevOps practices, CI/CD pipelines, and infrastructure architecture.',
  'git-collaboration':
    'Version control with Git, collaborative workflows, and team development practices.',
  'video-creative': 'Video production, editing, and creative content development skills.',
  'general-dev':
    'General software development practices, methodologies, and foundational programming concepts.',
}

const categoryPriority: string[] = [
  'frontend-javascript',
  'laravel-backend',
  'python-django',
  'wordpress',
  'ai-ml',
  'cloud-devops',
  'git-collaboration',
  'video-creative',
  'general-dev',
]

function parseDurationToHours(duration: string | null | undefined): number {
  if (!duration) return 0
  let hours = 0
  const hourMatch = duration.match(/(\d+)h/)
  const minMatch = duration.match(/(\d+)m/)
  if (hourMatch) hours += parseInt(hourMatch[1])
  if (minMatch) hours += parseInt(minMatch[1]) / 60
  return hours
}

function getCardSpanClass(hours: number): string {
  if (hours >= 15) return 'md:col-span-2' // 15+ hours: 2 columns
  if (hours >= 5) return 'md:col-span-2 2xl:col-span-1' // 5-14 hours: 2 columns on md, 1 on 2xl
  return '' // <5 hours: 1 column
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface CertificationCardProps {
  certification: Certification
  gradient: string
}

function CertificationCard({ certification, gradient }: CertificationCardProps) {
  const hours = parseDurationToHours(certification.duration)
  const spanClass = getCardSpanClass(hours)

  // Extract tech icons from certification title
  const techNames = extractTechFromCertificationTitle(certification.title)
  const fallbackCount = Math.max(0, 3 - techNames.length)
  const fallbackTech = fallbackCount > 0 ? getFallbackIcons(fallbackCount) : []
  const allTechNames = [...techNames, ...fallbackTech].slice(0, 5)

  return (
    <article
      className={`overflow-hidden rounded-[1.9rem] border border-white/10 bg-card-bg shadow-[0_18px_50px_rgba(0,0,0,0.32)] relative z-[100] ${spanClass}`}
    >
      {/* Gradient Header */}
      <div className={`relative min-h-[200px] bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.38))]" />

        {/* Floating Tech Stack Icons */}
        {allTechNames.map((techName, index) => {
          const IconComponent = techStackIcons[techName]
          if (!IconComponent) return null

          const position = getDynamicIconPosition(allTechNames.length, index, 0.8)
          const positionStyles: React.CSSProperties = {
            position: 'absolute',
            top: position.top,
            bottom: position.bottom,
            left: position.left,
            right: position.right,
            transform: position.transform
              ? `${position.transform} rotate(${position.rotation}deg)`
              : `rotate(${position.rotation}deg)`,
            fontSize: `${position.size}rem`,
          }

          return (
            <div
              key={`${techName}-${index}`}
              style={positionStyles}
              className="text-white/75 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            >
              <IconComponent />
            </div>
          )
        })}

        {/* Duration Badge */}
        {certification.duration && (
          <div className="absolute right-8 top-8 z-10 rounded-full border border-white/20 bg-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            {certification.duration}
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="rounded-[1.35rem] border border-white/15 bg-black/65 p-4 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
              {certification.issuer || 'Certificate'}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-white">
              {certification.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-6 bg-card-bg relative z-[101]">
        <div className="grid gap-2 text-[15px] leading-7 text-white/82">
          {certification.issueDate && (
            <p>
              <span className="text-white/55">Issued:</span> {formatDate(certification.issueDate)}
            </p>
          )}
          {certification.issuer && (
            <p>
              <span className="text-white/55">Provider:</span> {certification.issuer}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {certification.credentialUrl && (
            <a
              href={certification.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
            >
              View Certificate
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function matchesCertQuery(cert: Certification, q: string): boolean {
  if (!q) return true
  const haystack = [
    cert.title,
    cert.issuer,
    cert.category,
    categoryLabels[cert.category as string] ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q.toLowerCase())
}

export function AllCertificationsPage({ certifications = [] }: AllCertificationsPageProps) {
  const [query, setQuery] = useState('')

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleClear = useCallback(() => {
    setQuery('')
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0

  const searchResults = useMemo(
    () => (isSearching ? certifications.filter((c) => matchesCertQuery(c, trimmedQuery)) : []),
    [certifications, trimmedQuery, isSearching],
  )

  // Group certifications by category
  const uniqueCategories = Array.from(
    new Set(certifications.map((c) => c.category).filter(Boolean)),
  ) as string[]

  const certificationsByCategory = categoryPriority
    .filter((category) => uniqueCategories.includes(category))
    .map((category) => ({
      category,
      certifications: certifications.filter((c) => c.category === category),
    }))
    // Add any remaining categories not in priority list
    .concat(
      uniqueCategories
        .filter((category) => !categoryPriority.includes(category))
        .map((category) => ({
          category,
          certifications: certifications.filter((c) => c.category === category),
        })),
    )

  // Calculate stats
  const totalCerts = certifications.length
  const totalCategories = certificationsByCategory.length
  const longestPath = certifications.reduce((max, cert) => {
    const hours = parseDurationToHours(cert.duration)
    return hours > max ? hours : max
  }, 0)

  const transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div className="min-h-screen text-white">
      {/* Always-visible search header */}
      <header className="px-4 pt-28 sm:px-6 sm:pt-32 lg:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search certifications by name, provider, or technology..."
          />
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {!isSearching ? (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={transition}
          >
            {/* Hero (without SearchBar — lifted to header above) */}
            <section className="hero-bg relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-10 lg:pb-28">
              <HeroReveal
                className="mx-auto grid max-w-[1700px] gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start"
                staggerChildren={0.15}
                delay={0.2}
                duration={0.8}
              >
                <div>
                  <span className="inline-flex rounded-full border border-white/10 bg-[#191a21]/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 backdrop-blur">
                    FULL-STACK, AI, AND CLOUD DEVELOPER CERTIFICATIONS LIBRARY
                  </span>
                  <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-8xl">
                    One page to showcase my full-stack, AI, cloud, and web development
                    certifications.
                  </h1>
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-white/78">
                    This certifications page highlights my continuous learning in full-stack
                    development, AI engineering, SaaS platforms, cloud infrastructure, and
                    automation systems. Each certification reflects hands-on experience with
                    technologies such as Python, Laravel, WordPress, React, Next.js, DevOps, and
                    API development, helping me build scalable, high-performance applications and
                    real-world solutions.
                  </p>
                  <CTAButtons />
                </div>

                <aside className="space-y-6">
                  <div className="rounded-[2rem] border border-white/10 bg-[#11131b]/70 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/10 bg-card-bg p-5 relative z-[100]">
                        <div className="text-4xl font-black text-white">{totalCerts}</div>
                        <p className="mt-2 text-sm text-white/65">Certificates</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-card-bg p-5 relative z-[100]">
                        <div className="text-4xl font-black text-white">{totalCategories}</div>
                        <p className="mt-2 text-sm text-white/65">Skill categories</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-card-bg p-5 relative z-[100]">
                        <div className="text-4xl font-black text-white">
                          {Math.round(longestPath)}h
                        </div>
                        <p className="mt-2 text-sm text-white/65">Longest learning path</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-card-bg p-5 relative z-[100]">
                        <div className="text-4xl font-black brand-gradient">LinkedIn</div>
                        <p className="mt-2 text-sm text-white/65">
                          Verifiable certificate links included
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </HeroReveal>
            </section>

            {/* Certifications by Category */}
            {certificationsByCategory.map(({ category, certifications: categoryCerts }) => (
              <section
                key={category}
                id={category}
                className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-10"
              >
                <div className="mx-auto max-w-[1700px]">
                  <ScrollReveal className="mb-6" threshold={0.5} delay={0.2}>
                    <h2 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                      {categoryLabels[category] || category}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
                      {categoryDescriptions[category]} — {categoryCerts.length} certification
                      {categoryCerts.length !== 1 ? 's' : ''}
                    </p>
                  </ScrollReveal>
                  <ScrollReveal
                    className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3"
                    threshold={0.1}
                    staggerChildren={0.2}
                    delay={0.3}
                  >
                    {categoryCerts.map((cert, index) => (
                      <CertificationCard
                        key={cert.id}
                        certification={cert}
                        gradient={gradients[index % gradients.length]}
                      />
                    ))}
                  </ScrollReveal>
                </div>
              </section>
            ))}
          </motion.div>
        ) : (
          <motion.section
            key="search"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={transition}
            className="px-4 py-12 sm:px-6 sm:py-16 lg:px-10"
          >
            <div className="mx-auto max-w-[1700px]">
              <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
                  {searchResults.length}{' '}
                  {searchResults.length === 1 ? 'certification' : 'certifications'} match &ldquo;
                  {trimmedQuery}&rdquo;
                </h2>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
                >
                  Clear search ✕
                </button>
              </div>

              {searchResults.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3"
                >
                  {searchResults.map((cert, index) => (
                    <CertificationCard
                      key={cert.id}
                      certification={cert}
                      gradient={gradients[index % gradients.length]}
                    />
                  ))}
                </motion.div>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-card-bg p-10 text-center text-white/70">
                  No certifications match &ldquo;{trimmedQuery}&rdquo;. Try a different keyword or{' '}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="underline-offset-4 hover:underline"
                  >
                    clear the search
                  </button>
                  .
                </p>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <style jsx>{`
        .hero-bg {
          background: transparent;
        }
        .brand-gradient {
          background: linear-gradient(
            90deg,
            #ff7c94 0%,
            #ffd36f 25%,
            #75ff8d 50%,
            #7ed7ff 75%,
            #cf8dff 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  )
}
