import React from 'react'
import type { Certification, SiteSetting } from '@/payload-types'
import { Certifications } from './components/Certifications'

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

      <Certifications certifications={certifications} />
    </div>
  )
}
