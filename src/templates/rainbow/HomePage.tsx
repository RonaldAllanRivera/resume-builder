import React from 'react'
import type { Project, SiteSetting, ResumeProfile1 } from '@/payload-types'
import { Hero } from './components/Hero'

interface HomePageProps {
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  settings?: SiteSetting | null
}

export function HomePage({ profile, featuredProjects }: HomePageProps) {
  return (
    <div>
      {/* Hero Section with space background */}
      <Hero profile={profile} />

      {/* Featured Projects Section - Placeholder */}
      {featuredProjects && featuredProjects.length > 0 && (
        <section className="py-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:border-white/20 transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                {project.summary && <p className="text-white/70 text-sm">{project.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
