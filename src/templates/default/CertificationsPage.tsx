import React from 'react'
import type { Certification, SiteSetting } from '@/payload-types'

interface CertificationsPageProps {
  certifications?: Certification[]
  settings?: SiteSetting | null
}

export function CertificationsPage({ certifications }: CertificationsPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Certifications</h1>
      {certifications && certifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <article
              key={cert.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{cert.title}</h2>
              <p className="text-gray-600 mb-2">{cert.issuer}</p>
              {cert.issueDate && (
                <time className="text-sm text-gray-500" dateTime={cert.issueDate}>
                  {new Date(cert.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </time>
              )}
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  View Credential
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No certifications available.</p>
      )}
    </div>
  )
}
