import React from 'react'
import type { Education, SiteSetting } from '@/payload-types'

interface EducationPageProps {
  educations?: Education[]
  settings?: SiteSetting | null
}

export function EducationPage({ educations }: EducationPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Education</h1>
      {educations && educations.length > 0 ? (
        <div className="space-y-8">
          {educations.map((edu) => (
            <article key={edu.id} className="border-l-4 border-gray-300 pl-6">
              <h2 className="text-2xl font-semibold">{edu.degree}</h2>
              <p className="text-lg text-gray-600">{edu.school}</p>
              <p className="text-sm text-gray-500">
                {edu.startDate} - {edu.endDate || 'Present'}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No education data available.</p>
      )}
    </div>
  )
}
