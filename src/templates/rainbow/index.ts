import { Layout } from './components/Layout'
import { HomePage } from './HomePage'
import { ProjectsPage } from './ProjectsPage'
import { ExperiencePage } from './ExperiencePage'
import { EducationPage } from './EducationPage'
import { CertificationsPage } from './CertificationsPage'

export const RainbowTemplate = {
  Layout,
  HomePage,
  ProjectsPage,
  ExperiencePage,
  EducationPage,
  CertificationsPage,
}

export type RainbowTemplateType = typeof RainbowTemplate
