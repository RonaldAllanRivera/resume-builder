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
import { CredibilityStrip } from './components/CredibilityStrip'
import { FeaturedWork } from './components/FeaturedWork'
import { Experience as ExperienceSection } from './components/Experience'
import { Education as EducationSection } from './components/Education'
import { Certifications } from './components/Certifications'
import { HomeCTA } from './components/HomeCTA'

interface HomePageProps {
  profile?: ResumeProfile1 | null
  featuredProjects?: Project[]
  experiences?: Experience[]
  educations?: Education[]
  certifications?: Certification[]
  settings?: SiteSetting | null
}

export function HomePage({
  profile,
  featuredProjects,
  experiences,
  educations,
  certifications,
}: HomePageProps) {
  return (
    <div>
      <Hero profile={profile} />
      <CredibilityStrip />

      {featuredProjects && featuredProjects.length > 0 && (
        <FeaturedWork projects={featuredProjects} />
      )}

      {/* Each section component renders its own <section id="..."> with the correct anchor */}
      {experiences && experiences.length > 0 && <ExperienceSection experiences={experiences} />}

      {educations && educations.length > 0 && (
        <EducationSection educations={educations} certifications={certifications} />
      )}

      {certifications && certifications.length > 0 && (
        <Certifications certifications={certifications} />
      )}

      <HomeCTA />
    </div>
  )
}
