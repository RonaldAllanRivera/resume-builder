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

      {experiences && experiences.length > 0 && (
        <section id="experience" className="scroll-mt-24">
          <ExperienceSection experiences={experiences} />
        </section>
      )}

      {educations && educations.length > 0 && (
        <section id="education" className="scroll-mt-24">
          <EducationSection educations={educations} certifications={certifications} />
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section id="certifications" className="scroll-mt-24">
          <Certifications certifications={certifications} />
        </section>
      )}

      <HomeCTA />
    </div>
  )
}
