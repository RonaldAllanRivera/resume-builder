import React from 'react'
import type { Certification, SiteSetting } from '@/payload-types'

interface CertificationsPageProps {
  certifications?: Certification[]
  settings?: SiteSetting | null
}

export function CertificationsPage({ certifications = [] }: CertificationsPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-400 bg-clip-text text-transparent">
        Certifications
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:border-white/20 transition-all duration-300"
          >
            <h2 className="text-xl font-semibold mb-2">{cert.title}</h2>
            {cert.issuer && <p className="text-white/70 text-sm mb-2">{cert.issuer}</p>}
            {cert.issueDate && (
              <p className="text-white/60 text-xs">
                {new Date(cert.issueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
