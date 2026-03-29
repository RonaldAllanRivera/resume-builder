import React from 'react'
import type {
  Project,
  SiteSetting,
  ResumeProfile1,
  Experience,
  Education,
  Certification,
} from '@/payload-types'
import { Hero } from './components/Hero'
import { FeaturedWork } from './components/FeaturedWork'
import { Experience as ExperienceSection } from './components/Experience'
import { Education as EducationSection } from './components/Education'
import { Certifications } from './components/Certifications'

interface HomePageProps {
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  allProjects?: Project[]
  experiences?: Experience[]
  educations?: Education[]
  certifications?: Certification[]
  settings?: SiteSetting | null
}

export function HomePage({
  profile,
  featuredProjects,
  allProjects,
  experiences,
  educations,
  certifications,
}: HomePageProps) {
  return (
    <div>
      {/* Hero Section with space background */}
      <Hero profile={profile} projects={allProjects} />

      {/* Featured Work Section */}
      {featuredProjects && featuredProjects.length > 0 && (
        <FeaturedWork projects={featuredProjects} />
      )}

      {/* Experience Section */}
      {experiences && experiences.length > 0 && <ExperienceSection experiences={experiences} />}

      {/* Education Section */}
      {educations && educations.length > 0 && (
        <EducationSection educations={educations} certifications={certifications} />
      )}

      {/* Certifications Section */}
      {certifications && certifications.length > 0 && (
        <Certifications certifications={certifications} />
      )}
    </div>
  )
}
