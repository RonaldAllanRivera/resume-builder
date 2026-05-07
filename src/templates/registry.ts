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
  Package,
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
  SearchPage?: ComponentType
  PricingPage?: ComponentType<{
    packages: Package[]
  }>
}

export type TemplateKey = 'rainbow'

// Import Rainbow template
import { ContactPage as RainbowContactPage } from './rainbow/ContactPage'
import { SearchPage as RainbowSearchPage } from './rainbow/SearchPage'
import { Layout as RainbowLayout } from './rainbow/components/Layout'
import { PricingPage as RainbowPricingPage } from './rainbow/components/PricingPage'
import { HomePage as RainbowHomePage } from './rainbow/HomePage'
import { ExperiencePage as RainbowExperiencePage } from './rainbow/ExperiencePage'
import { EducationPage as RainbowEducationPage } from './rainbow/EducationPage'
import { ProjectsPage as RainbowProjectsPage } from './rainbow/ProjectsPage'
import { ProjectCategoryPage as RainbowProjectCategoryPage } from './rainbow/ProjectCategoryPage'
import { AllCertificationsPage as RainbowCertificationsPage } from './rainbow/AllCertificationsPage'

// Template registry
const templates: Record<TemplateKey, TemplateComponents> = {
  rainbow: {
    Layout: RainbowLayout,
    HomePage: RainbowHomePage,
    ExperiencePage: RainbowExperiencePage,
    EducationPage: RainbowEducationPage,
    ProjectsPage: RainbowProjectsPage,
    ProjectCategoryPage: RainbowProjectCategoryPage,
    CertificationsPage: RainbowCertificationsPage,
    ContactPage: RainbowContactPage,
    SearchPage: RainbowSearchPage,
    PricingPage: RainbowPricingPage,
  },
}

/**
 * Get template components by key
 * Falls back to rainbow template if key is invalid
 */
export function getTemplate(key: string): TemplateComponents {
  const validKeys: TemplateKey[] = ['rainbow']
  const templateKey = validKeys.includes(key as TemplateKey) ? (key as TemplateKey) : 'rainbow'
  return templates[templateKey]
}

/**
 * Get list of available templates
 */
export function getAvailableTemplates(): TemplateKey[] {
  return Object.keys(templates) as TemplateKey[]
}
