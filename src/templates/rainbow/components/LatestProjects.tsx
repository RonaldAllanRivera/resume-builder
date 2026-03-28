import React from 'react'
import type { Project } from '@/payload-types'
import { ProjectCard } from './ProjectCard'

interface LatestProjectsProps {
  projects: (Project | null)[]
}

// Gradient variants for visual variety - matching AllProjectsPage
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

export function LatestProjects({ projects }: LatestProjectsProps) {
  // Filter out null projects
  const validProjects = projects.filter((p): p is Project => p !== null)

  if (validProjects.length === 0) {
    return null
  }

  return (
    <section id="projects" className="py-9">
      <div className="mx-auto w-[min(calc(100%-40px),1320px)]">
        {/* Section Header */}
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Latest Projects
          </h2>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {validProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              gradient={gradients[index % gradients.length]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
