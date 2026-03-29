import React from 'react'
import type { Certification } from '@/payload-types'

interface CertificationsProps {
  certifications: Certification[]
}

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

export function Certifications({ certifications }: CertificationsProps) {
  if (!certifications || certifications.length === 0) return null

  // Sort by issue date (most recent first) and take top 3
  const latestCertifications = [...certifications]
    .filter((cert) => cert.issueDate) // Only include certs with dates
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
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Latest Certifications
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestCertifications.map((cert) => (
            <article
              key={cert.id}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="mb-3">
                <span className="inline-block rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-1 text-xs font-semibold text-black">
                  {categoryLabels[cert.category || 'general-dev'] || cert.category}
                </span>
              </div>
              <h3 className="mb-2 text-[1.35rem] font-bold text-white">{cert.title}</h3>
              {cert.issuer && <p className="mb-2 text-sm text-white/75">{cert.issuer}</p>}
              {cert.duration && (
                <p className="mb-2 text-xs text-white/60">Duration: {cert.duration}</p>
              )}
              {cert.issueDate && (
                <p className="mb-3 text-xs text-white/50">
                  Issued:{' '}
                  {new Date(cert.issueDate).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-4 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
                >
                  View Certificate →
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
