import React from 'react'
import type { Certification, SiteSetting } from '@/payload-types'

interface CertificationsPageProps {
  certifications?: Certification[]
  settings?: SiteSetting | null
}

const categoryLabels: Record<string, string> = {
  'frontend-javascript': 'Frontend & JavaScript',
  'laravel-backend': 'Laravel & Backend',
  'python-django': 'Python & Django',
  'wordpress': 'WordPress',
  'ai-ml': 'AI & Machine Learning',
  'cloud-devops': 'Cloud, DevOps & Architecture',
  'git-collaboration': 'Git & Collaboration',
  'video-creative': 'Video & Creative',
  'general-dev': 'General Development',
}

const categoryOrder = [
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

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function CertificationsPage({ certifications }: CertificationsPageProps) {
  // Group certifications by category
  const certsByCategory = certifications?.reduce((acc, cert) => {
    const category = cert.category || 'general-dev'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(cert)
    return acc
  }, {} as Record<string, Certification[]>) || {}

  // Sort certifications within each category by issue date (newest first)
  Object.keys(certsByCategory).forEach(category => {
    certsByCategory[category].sort((a, b) => {
      const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0
      const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0
      return dateB - dateA
    })
  })

  // Filter to only show categories that have certifications
  const orderedCategories = categoryOrder.filter(cat => certsByCategory[cat])

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-4xl font-bold mb-12">Certifications</h1>
      {certifications && certifications.length > 0 ? (
        <div className="space-y-12">
          {orderedCategories.map((category) => {
            const categoryCerts = certsByCategory[category]
            return (
              <section key={category}>
                <h2 className="text-2xl font-bold mb-6">{categoryLabels[category] || category}</h2>
                <p className="text-sm text-gray-600 mb-6">
                  {categoryCerts.length} certification{categoryCerts.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryCerts.map((cert) => (
                    <article
                      key={cert.id}
                      className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                    >
                      {/* Header with gradient background */}
                      <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 text-white">
                        <p className="text-xs uppercase tracking-wider mb-2 opacity-90">
                          {cert.issuer || 'Certificate'}
                        </p>
                        <h3 className="text-xl font-semibold">{cert.title}</h3>
                      </div>

                      {/* Content */}
                      <div className="p-6 bg-gray-900 text-gray-300">
                        {/* Issued Date */}
                        {cert.issueDate && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Issued: </span>
                            <time className="text-sm" dateTime={cert.issueDate}>
                              {formatDate(cert.issueDate)}
                            </time>
                          </div>
                        )}

                        {/* Duration */}
                        {cert.duration && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Time: </span>
                            <span className="text-sm">{cert.duration}</span>
                          </div>
                        )}

                        {/* Provider */}
                        {cert.issuer && (
                          <div className="mb-4">
                            <span className="text-sm text-gray-400">Provider: </span>
                            <span className="text-sm">{cert.issuer}</span>
                          </div>
                        )}

                        {/* View Certificate Button */}
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 border border-gray-600 text-white text-sm rounded hover:bg-gray-800 transition-colors"
                          >
                            View Certificate
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-600">No certifications available.</p>
      )}
    </div>
  )
}
