import React from 'react'
import type { Project, SiteSetting, ResumeProfile1 } from '@/payload-types'
import { Hero } from './components/Hero'
import { FeaturedWork } from './components/FeaturedWork'
import { LatestProjects } from './components/LatestProjects'

interface HomePageProps {
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  latestProjects?: (Project | null)[]
  settings?: SiteSetting | null
}

export function HomePage({ profile, featuredProjects, latestProjects }: HomePageProps) {
  return (
    <div>
      {/* Hero Section with space background */}
      <Hero profile={profile} />

      {/* Featured Work Section */}
      {featuredProjects && featuredProjects.length > 0 && (
        <FeaturedWork projects={featuredProjects} />
      )}

      {/* Latest Projects Section */}
      {latestProjects && latestProjects.length > 0 && <LatestProjects projects={latestProjects} />}
    </div>
  )
}
