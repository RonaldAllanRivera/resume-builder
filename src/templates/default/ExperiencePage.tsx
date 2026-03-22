import React from 'react'
import type { Experience, SiteSetting } from '@/payload-types'

interface ExperiencePageProps {
  experiences?: Experience[]
  settings?: SiteSetting | null
}

export function ExperiencePage({ experiences }: ExperiencePageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Experience</h1>
      {experiences && experiences.length > 0 ? (
        <div className="space-y-8">
          {experiences.map((exp) => (
            <article key={exp.id} className="border-l-4 border-gray-300 pl-6">
              <h2 className="text-2xl font-semibold">{exp.title}</h2>
              {typeof exp.company === 'object' && exp.company?.name && (
                <p className="text-lg text-gray-600">{exp.company.name}</p>
              )}
              <p className="text-sm text-gray-500">
                {exp.startDate} - {exp.endDate || 'Present'}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No experience data available.</p>
      )}
    </div>
  )
}
