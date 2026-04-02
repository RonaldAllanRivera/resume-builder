import React from 'react'
import type { Project } from '@/payload-types'
import { ProjectCard } from './ProjectCard'

interface FeaturedWorkProps {
  projects: Project[]
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

export function FeaturedWork({ projects }: FeaturedWorkProps) {
  if (!projects || projects.length === 0) return null

  const firstTwo = projects.slice(0, 2)
  const remaining = projects.slice(2)

  return (
    <section id="services" className="scroll-mt-24 py-16 relative z-[50]">
      <div className="mx-auto w-[min(calc(100%-40px),1320px)] relative z-[60]">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Featured work
          </h2>
        </div>

        {/* First Two Projects - Grid */}
        <div className="grid gap-6 md:grid-cols-2 relative z-[70]">
          {firstTwo.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              gradient={gradients[index % gradients.length]}
            />
          ))}
        </div>

        {/* Remaining Projects - Grid */}
        {remaining.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-2 2xl:grid-cols-3 relative z-[70]">
            {remaining.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                gradient={gradients[(index + 2) % gradients.length]}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
