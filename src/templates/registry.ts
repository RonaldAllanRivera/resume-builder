/**
 * Template Registry
 * Maps template keys to their component implementations
 * Add new templates by importing them and adding to the registry
 */

import type { ComponentType } from 'react'
import type {
  Project,
  Certification,
  Experience,
  Education,
  SiteSetting,
  ResumeProfile1,
} from '@/payload-types'

export interface TemplateComponents {
  Layout:
    | ComponentType<{ children: React.ReactNode }>
    | ((props: { children: React.ReactNode }) => Promise<React.ReactElement>)
  HomePage: ComponentType<{
    profile?: ResumeProfile1 | null
    featuredProjects?: Project[]
    allProjects?: Project[]
    experiences?: Experience[]
    educations?: Education[]
    certifications?: Certification[]
    settings?: SiteSetting | null
  }>
  ExperiencePage: ComponentType<{
    experiences?: Experience[]
    settings?: SiteSetting | null
  }>
  EducationPage: ComponentType<{
    educations?: Education[]
    settings?: SiteSetting | null
  }>
  ProjectsPage: ComponentType<{
    projects?: Project[]
    settings?: SiteSetting | null
  }>
  ProjectCategoryPage: ComponentType<{
    category: string
    projects?: Project[]
    settings?: SiteSetting | null
  }>
  CertificationsPage: ComponentType<{
    certifications?: Certification[]
    settings?: SiteSetting | null
  }>
  ContactPage?: ComponentType<{
    settings?: SiteSetting | null
  }>
}

export type TemplateKey = 'default' | 'modern' | 'minimal' | 'rainbow'

// Import default template
import { Layout as DefaultLayout } from './default/Layout'
import { HomePage as DefaultHomePage } from './default/HomePage'
import { ExperiencePage as DefaultExperiencePage } from './default/ExperiencePage'
import { EducationPage as DefaultEducationPage } from './default/EducationPage'
import { ProjectsPage as DefaultProjectsPage } from './default/ProjectsPage'
import { ProjectCategoryPage as DefaultProjectCategoryPage } from './default/ProjectCategoryPage'
import { CertificationsPage as DefaultCertificationsPage } from './default/CertificationsPage'

// Import Rainbow template
import { ContactPage as RainbowContactPage } from './rainbow/ContactPage'
import { Layout as RainbowLayout } from './rainbow/components/Layout'
import { HomePage as RainbowHomePage } from './rainbow/HomePage'
import { ExperiencePage as RainbowExperiencePage } from './rainbow/ExperiencePage'
import { EducationPage as RainbowEducationPage } from './rainbow/EducationPage'
import { ProjectsPage as RainbowProjectsPage } from './rainbow/ProjectsPage'
import { AllCertificationsPage as RainbowCertificationsPage } from './rainbow/AllCertificationsPage'

// Template registry
const templates: Record<TemplateKey, TemplateComponents> = {
  default: {
    Layout: DefaultLayout,
    HomePage: DefaultHomePage,
    ExperiencePage: DefaultExperiencePage,
    EducationPage: DefaultEducationPage,
    ProjectsPage: DefaultProjectsPage,
    ProjectCategoryPage: DefaultProjectCategoryPage,
    CertificationsPage: DefaultCertificationsPage,
  },
  // Placeholder for future templates
  modern: {
    Layout: DefaultLayout,
    HomePage: DefaultHomePage,
    ExperiencePage: DefaultExperiencePage,
    EducationPage: DefaultEducationPage,
    ProjectsPage: DefaultProjectsPage,
    ProjectCategoryPage: DefaultProjectCategoryPage,
    CertificationsPage: DefaultCertificationsPage,
  },
  minimal: {
    Layout: DefaultLayout,
    HomePage: DefaultHomePage,
    ExperiencePage: DefaultExperiencePage,
    EducationPage: DefaultEducationPage,
    ProjectsPage: DefaultProjectsPage,
    ProjectCategoryPage: DefaultProjectCategoryPage,
    CertificationsPage: DefaultCertificationsPage,
  },
  rainbow: {
    Layout: RainbowLayout,
    HomePage: RainbowHomePage,
    ExperiencePage: RainbowExperiencePage,
    EducationPage: RainbowEducationPage,
    ProjectsPage: RainbowProjectsPage,
    ProjectCategoryPage: DefaultProjectCategoryPage, // Reuse default for now
    CertificationsPage: RainbowCertificationsPage,
    ContactPage: RainbowContactPage,
  },
}

/**
 * Get template components by key
 * Falls back to default template if key is invalid
 */
export function getTemplate(key: string): TemplateComponents {
  const validKeys: TemplateKey[] = ['default', 'modern', 'minimal', 'rainbow']
  const templateKey = validKeys.includes(key as TemplateKey) ? (key as TemplateKey) : 'default'
  return templates[templateKey]
}

/**
 * Get list of available templates
 */
export function getAvailableTemplates(): TemplateKey[] {
  return Object.keys(templates) as TemplateKey[]
}
