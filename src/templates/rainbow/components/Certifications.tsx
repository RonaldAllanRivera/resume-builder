import React from 'react'
import Link from 'next/link'
import type { Certification } from '@/payload-types'
import {
  techStackIcons,
  getDynamicIconPosition,
  extractTechFromCertificationTitle,
  getFallbackIcons,
} from '@/utilities/techStackIcons'
import { ScrollReveal } from './ScrollReveal'

interface CertificationsProps {
  certifications: Certification[]
}

const gradients = [
  'from-emerald-400 via-cyan-400 to-blue-500',
  'from-rose-400 via-orange-300 to-amber-300',
  'from-orange-400 via-yellow-300 to-lime-300',
]

// Parse duration string (e.g., "1h 32m") to total hours
function parseDurationToHours(duration?: string | null): number {
  if (!duration) return 0
  let hours = 0
  const hourMatch = duration.match(/(\d+)h/)
  const minMatch = duration.match(/(\d+)m/)
  if (hourMatch) hours += parseInt(hourMatch[1])
  if (minMatch) hours += parseInt(minMatch[1]) / 60
  return hours
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function Certifications({ certifications }: CertificationsProps) {
  if (!certifications || certifications.length === 0) return null

  // Filter certifications with 10+ hours duration, sort by issue date, take top 3
  const latestCertifications = [...certifications]
    .filter((cert) => {
      if (!cert.issueDate) return false
      const hours = parseDurationToHours(cert.duration)
      return hours >= 10 // Only certifications with 10+ hours
    })
    .sort((a, b) => {
      const dateA = new Date(a.issueDate!).getTime()
      const dateB = new Date(b.issueDate!).getTime()
      return dateB - dateA // Descending order (newest first)
    })
    .slice(0, 3)

  if (latestCertifications.length === 0) return null

  return (
    <section id="certifications" className="scroll-mt-24 py-16">
      <div className="mx-auto w-[min(calc(100%-40px),1320px)]">
        <ScrollReveal
          className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          threshold={0.5}
          delay={0.2}
        >
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Latest Certifications
          </h2>
          <Link
            href="/certifications"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
          >
            View all {certifications.length} certifications →
          </Link>
        </ScrollReveal>
        <ScrollReveal
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          threshold={0.1}
          staggerChildren={0.3}
          delay={0.3}
        >
          {latestCertifications.map((cert, index) => {
            const gradient = gradients[index % gradients.length]
            const techNames = extractTechFromCertificationTitle(cert.title)
            const fallbackCount = Math.max(0, 3 - techNames.length)
            const fallbackTech = fallbackCount > 0 ? getFallbackIcons(fallbackCount) : []
            const allTechNames = [...techNames, ...fallbackTech].slice(0, 5)

            return (
              <article
                key={cert.id}
                className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#11131a] shadow-[0_18px_50px_rgba(0,0,0,0.32)] relative z-[100]"
              >
                {/* Gradient Header */}
                <div className={`relative min-h-[200px] bg-gradient-to-br ${gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.38))]" />

                  {/* Floating Tech Stack Icons */}
                  {allTechNames.map((techName, techIndex) => {
                    const IconComponent = techStackIcons[techName]
                    if (!IconComponent) return null

                    const position = getDynamicIconPosition(allTechNames.length, techIndex, 0.8)
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
                        key={`${techName}-${techIndex}`}
                        style={positionStyles}
                        className="text-white/75 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                      >
                        <IconComponent />
                      </div>
                    )
                  })}

                  {/* Duration Badge */}
                  {cert.duration && (
                    <div className="absolute right-8 top-8 z-10 rounded-full border border-white/20 bg-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                      {cert.duration}
                    </div>
                  )}

                  {/* Title Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="rounded-[1.35rem] border border-white/15 bg-black/65 p-4 backdrop-blur-md">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
                        {cert.issuer || 'Certificate'}
                      </p>
                      <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-white">
                        {cert.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 p-6 bg-card-bg relative z-[101]">
                  <div className="grid gap-2 text-[15px] leading-7 text-white/82">
                    {cert.issueDate && (
                      <p>
                        <span className="text-white/55">Issued:</span> {formatDate(cert.issueDate)}
                      </p>
                    )}
                    {cert.issuer && (
                      <p>
                        <span className="text-white/55">Provider:</span> {cert.issuer}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
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
          })}
        </ScrollReveal>
      </div>
    </section>
  )
}
