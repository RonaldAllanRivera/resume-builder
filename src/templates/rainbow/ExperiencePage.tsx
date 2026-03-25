import React from 'react'
import type { Experience, SiteSetting } from '@/payload-types'

interface ExperiencePageProps {
  experiences?: Experience[]
  settings?: SiteSetting | null
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export function ExperiencePage({ experiences = [] }: ExperiencePageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
        Experience
      </h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:border-white/20 transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold mb-2">{exp.title}</h2>
            <p className="text-white/60 text-sm mb-3">
              {formatDate(exp.startDate)} -{' '}
              {exp.current || !exp.endDate ? 'Present' : formatDate(exp.endDate)}
            </p>
            {exp.location && <p className="text-white/50 text-sm mb-4">{exp.location}</p>}
            {exp.highlights && exp.highlights.length > 0 && (
              <ul className="space-y-2 mt-4">
                {exp.highlights.map((highlight, idx) => (
                  <li key={highlight.id || idx} className="flex items-start">
                    <span className="text-cyan-400 mr-2 mt-1">•</span>
                    <span className="text-white/70 text-sm">{highlight.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
