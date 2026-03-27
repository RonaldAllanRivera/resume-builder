'use client'

import React from 'react'
import type { Project } from '@/payload-types'
import {
  techStackIcons,
  getDynamicIconPosition,
  extractTechFromDescription,
  getFallbackIcons,
} from '@/utilities/techStackIcons'
import { CTAButtons } from './components/CTAButtons'

interface AllProjectsPageProps {
  projects: Project[]
}

const gradients = [
  'from-emerald-400 via-cyan-400 to-blue-500',
  'from-rose-400 via-orange-300 to-amber-300',
  'from-orange-400 via-yellow-300 to-lime-300',
  'from-fuchsia-400 via-pink-300 to-rose-300',
  'from-sky-400 via-indigo-300 to-violet-400',
  'from-cyan-400 via-teal-300 to-emerald-300',
  'from-violet-400 via-purple-300 to-indigo-400',
  'from-pink-400 via-fuchsia-300 to-purple-400',
  'from-blue-400 via-sky-300 to-cyan-300',
  'from-indigo-400 via-blue-300 to-cyan-300',
  'from-amber-300 via-yellow-300 to-orange-400',
]

const categoryLabels: Record<string, string> = {
  'full-stack': 'Full Stack Development',
  wordpress: 'WordPress Development',
  automation: 'Automation & Software Engineering',
  'graphic-design': 'Graphic Design',
}

const categoryDescriptions: Record<string, string> = {
  'full-stack':
    'End-to-end web applications built with modern frameworks like Laravel, Django, React, Next.js, and Vue.',
  wordpress:
    'Custom WordPress plugins, themes, and integrations for scalable content management and eCommerce solutions.',
  automation:
    'Python automation tools, web scrapers, and desktop applications for data processing and workflow optimization.',
  'graphic-design':
    'Branding, layout design, and digital creative work demonstrating visual communication skills.',
}

const categoryPriority: string[] = ['full-stack', 'wordpress', 'automation', 'graphic-design']

export function AllProjectsPage({ projects }: AllProjectsPageProps) {
  // Sort projects by order field (lower order = higher priority)
  const sortedProjects = [...projects].sort((a, b) => {
    const orderA = a.order ?? 999
    const orderB = b.order ?? 999
    return orderA - orderB
  })

  // Group projects by category for display (using sorted projects and category priority)
  const uniqueCategories = Array.from(
    new Set(sortedProjects.map((p) => p.category).filter(Boolean)),
  ) as string[]
  const projectsByCategory = categoryPriority
    .filter((category) => uniqueCategories.includes(category))
    .map((category) => ({
      category,
      projects: sortedProjects.filter((p) => p.category === category),
    }))
    // Add any remaining categories not in priority list
    .concat(
      uniqueCategories
        .filter((category) => !categoryPriority.includes(category))
        .map((category) => ({
          category,
          projects: sortedProjects.filter((p) => p.category === category),
        })),
    )

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      {/* Hero Section */}
      <section className="hero-bg relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pb-28 lg:pt-32">
        <div className="mx-auto grid max-w-[1700px] gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 backdrop-blur">
              Complete Project Library
            </span>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-8xl">
              All Projects in One Place
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/78">
              Explore my complete portfolio of {projects.length} projects across 4 categories. Each
              project showcases production-ready solutions with full technical details, tech stack,
              and live demos.
            </p>
            <CTAButtons />
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[#11131b]/70 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                <div className="text-4xl font-black text-white">{projects.length}</div>
                <p className="mt-2 text-sm text-white/65">Total Projects</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                <div className="text-4xl font-black text-white">4</div>
                <p className="mt-2 text-sm text-white/65">Categories</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                <div className="text-4xl font-black text-white">20+</div>
                <p className="mt-2 text-sm text-white/65">Years Experience</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                <div className="text-4xl font-black brand-gradient">Live</div>
                <p className="mt-2 text-sm text-white/65">Production Ready</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Projects by Category */}
      {projectsByCategory.map(({ category, projects: categoryProjects }) => (
        <section key={category} id={category} className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1700px]">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                {categoryLabels[category] || category}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
                {categoryDescriptions[category]} — {categoryProjects.length} projects
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {categoryProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  gradient={gradients[index % gradients.length]}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      <style jsx>{`
        .hero-bg {
          background:
            linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.22) 0%,
              rgba(0, 0, 0, 0.55) 70%,
              rgba(0, 0, 0, 0.88) 100%
            ),
            radial-gradient(circle at 20% 30%, rgba(255, 124, 148, 0.16), transparent 22%),
            radial-gradient(circle at 55% 40%, rgba(125, 255, 141, 0.1), transparent 20%),
            radial-gradient(circle at 78% 22%, rgba(126, 215, 255, 0.12), transparent 18%),
            radial-gradient(circle at 50% 82%, rgba(207, 141, 255, 0.12), transparent 20%),
            linear-gradient(120deg, #0a0b11 0%, #0c1020 55%, #07080c 100%);
        }
        .brand-gradient {
          background: linear-gradient(
            90deg,
            #ff7c94 0%,
            #ffd36f 25%,
            #75ff8d 50%,
            #7ed7ff 75%,
            #cf8dff 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  gradient: string
}

function ProjectCard({ project, gradient }: ProjectCardProps) {
  // Get valid icons from tech stack
  const validIconNames = (project.techStack || [])
    .map((tech) =>
      typeof tech === 'object' && tech !== null && 'name' in tech ? tech.name : String(tech),
    )
    .filter((techName) => techStackIcons[techName])

  // If less than 3 icons, try to extract from description
  let iconsToShow = [...validIconNames]
  if (iconsToShow.length < 3) {
    const descriptionTech = extractTechFromDescription(project.summary || '')
    const additionalIcons = descriptionTech.filter((tech) => !iconsToShow.includes(tech))
    iconsToShow = [...iconsToShow, ...additionalIcons]
  }

  // If still less than 3, add fallback generic icons
  if (iconsToShow.length < 3) {
    const fallbacks = getFallbackIcons(3 - iconsToShow.length)
    iconsToShow = [...iconsToShow, ...fallbacks]
  }

  return (
    <article className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#11131a] shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      {/* Project Image with Floating Tech Stack Icons */}
      <div className={`relative min-h-[320px] bg-gradient-to-br ${gradient}`}>
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.38))]" />

        {/* Floating Tech Stack Icons */}
        {iconsToShow.slice(0, 10).map((techName, techIndex) => {
          const Icon = techStackIcons[techName]
          if (!Icon) return null

          const position = getDynamicIconPosition(Math.min(iconsToShow.length, 10), techIndex, 1.0)

          return (
            <Icon
              key={techIndex}
              className="absolute text-white/90 drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] z-10"
              style={{
                fontSize: `${position.size}rem`,
                top: position.top,
                left: position.left,
                right: position.right,
                bottom: position.bottom,
                transform: `${position.transform || ''} rotate(${position.rotation}deg)`.trim(),
              }}
            />
          )
        })}

        {/* Project Title Overlay (bottom) */}
        <div className="absolute inset-x-0 bottom-0 p-5 z-30">
          <div className="rounded-[1.35rem] border border-white/15 bg-black/65 p-4 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
              {project.category?.replace('-', ' ')}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-white">
              {project.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Project Content */}
      <div className="space-y-4 p-6">
        <p className="text-[15px] leading-7 text-white/82">{project.summary}</p>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3">
          {(project.liveUrl || project.repoUrl) && (
            <a
              href={(project.liveUrl || project.repoUrl) ?? ''}
              target="_blank"
              rel="nofollow noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
            >
              {project.liveUrl ? 'View Live' : 'View Code'}
            </a>
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Full description visible
          </span>
        </div>
      </div>
    </article>
  )
}
