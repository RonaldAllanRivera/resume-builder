import React from 'react'
import type { Education, SiteSetting } from '@/payload-types'

interface EducationPageProps {
  educations?: Education[]
  settings?: SiteSetting | null
}

export function EducationPage({ educations = [] }: EducationPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-300 via-orange-300 to-red-400 bg-clip-text text-transparent">
        Education
      </h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {educations.map((edu) => (
          <div
            key={edu.id}
            className="p-6 rounded-2xl border border-white/10 bg-card-bg backdrop-blur hover:border-white/20 transition-all duration-300"
          >
            <h2 className="text-2xl font-semibold mb-2">{edu.degree}</h2>
            <p className="text-white/70 mb-2">{edu.school}</p>
            {edu.location && <p className="text-white/60 text-sm">{edu.location}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
