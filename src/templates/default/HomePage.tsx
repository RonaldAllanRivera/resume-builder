import React from 'react'
import type {
  Project,
  SiteSetting,
  ResumeProfile1,
  Experience,
  Education,
  Certification,
} from '@/payload-types'

interface HomePageProps {
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  experiences?: Experience[]
  educations?: Education[]
  certifications?: Certification[]
  settings?: SiteSetting | null
}

export function HomePage({ profile, featuredProjects, settings }: HomePageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">
        {profile?.fullName || settings?.siteName || 'Welcome'}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {profile?.headline ||
          'This is the default template homepage. Customize this in your template design.'}
      </p>

      {featuredProjects && featuredProjects.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-gray-600">{project.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
