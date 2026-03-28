'use client'

import React from 'react'
import type { Project } from '@/payload-types'
import { CTAButtons } from './components/CTAButtons'
import { ProjectCard } from './components/ProjectCard'
import { Starfield } from './components/Starfield'

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
        {/* Animated starfield canvas */}
        <Starfield />
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
