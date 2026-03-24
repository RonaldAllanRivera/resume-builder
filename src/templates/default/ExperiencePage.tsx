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

export function ExperiencePage({ experiences }: ExperiencePageProps) {
  // Group experiences by recency
  const sortedExperiences =
    experiences?.slice().sort((a, b) => {
      const aDate = a.endDate || new Date().toISOString()
      const bDate = b.endDate || new Date().toISOString()
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    }) || []

  const recentExperience = sortedExperiences[0]
  const earlierExperiences = sortedExperiences.slice(1)

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-12">Experience</h1>

      {experiences && experiences.length > 0 ? (
        <div className="space-y-12">
          {/* Recent Experience */}
          {recentExperience && (
            <article className="border-l-4 border-blue-500 pl-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">RECENT</p>
                <h2 className="text-2xl font-semibold mb-1">{recentExperience.title}</h2>
                <p className="text-gray-600 mb-3">
                  {formatDate(recentExperience.startDate)} -{' '}
                  {recentExperience.current || !recentExperience.endDate
                    ? 'Present'
                    : formatDate(recentExperience.endDate)}
                </p>
              </div>

              {recentExperience.content && (
                <div className="text-gray-700 mb-4 prose prose-sm max-w-none">
                  {typeof recentExperience.content === 'string' ? (
                    <p>{recentExperience.content}</p>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: JSON.stringify(recentExperience.content) }}
                    />
                  )}
                </div>
              )}

              {recentExperience.highlights && recentExperience.highlights.length > 0 && (
                <ul className="space-y-2">
                  {recentExperience.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{highlight.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )}

          {/* Earlier Experiences */}
          {earlierExperiences.length > 0 && (
            <div className="space-y-8">
              {earlierExperiences.length > 0 && (
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">EARLIER</p>
              )}
              {earlierExperiences.map((exp) => (
                <article key={exp.id} className="border-l-4 border-gray-300 pl-6">
                  <h2 className="text-xl font-semibold mb-1">{exp.title}</h2>
                  <p className="text-gray-600 mb-3">
                    {formatDate(exp.startDate)} -{' '}
                    {exp.current || !exp.endDate ? 'Present' : formatDate(exp.endDate)}
                  </p>

                  {exp.content && (
                    <div className="text-gray-700 mb-3 prose prose-sm max-w-none">
                      {typeof exp.content === 'string' ? (
                        <p>{exp.content}</p>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: JSON.stringify(exp.content) }} />
                      )}
                    </div>
                  )}

                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="space-y-1.5">
                      {exp.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-gray-400 mr-2 mt-1">•</span>
                          <span className="text-gray-600 text-sm">{highlight.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">No experience data available.</p>
      )}
    </div>
  )
}
