import React from 'react'
import type { Education, SiteSetting } from '@/payload-types'

interface EducationPageProps {
  educations?: Education[]
  settings?: SiteSetting | null
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export function EducationPage({ educations }: EducationPageProps) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-12">Education</h1>
      {educations && educations.length > 0 ? (
        <div className="space-y-8">
          {educations.map((edu) => (
            <article key={edu.id} className="border-l-4 border-gray-300 pl-6">
              <h2 className="text-2xl font-semibold mb-1">{edu.degree}</h2>
              <p className="text-lg text-gray-600 mb-2">
                {edu.school}
                {edu.location && ` - ${edu.location}`}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
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
