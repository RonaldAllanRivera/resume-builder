import React from 'react'
import type { Project, SiteSetting } from '@/payload-types'
import { AllProjectsPage } from './AllProjectsPage'

interface ProjectsPageProps {
  projects?: Project[]
  settings?: SiteSetting | null
}

export function ProjectsPage({ projects = [] }: ProjectsPageProps) {
  return <AllProjectsPage projects={projects} />
}
