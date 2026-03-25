import React from 'react'
import type { Project, SiteSetting } from '@/payload-types'

interface ProjectsPageProps {
  projects?: Project[]
  settings?: SiteSetting | null
}

export function ProjectsPage({ projects = [] }: ProjectsPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400 bg-clip-text text-transparent">
        Projects
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:border-white/20 transition-all duration-300 hover:scale-105"
          >
            <h2 className="text-2xl font-semibold mb-3">{project.title}</h2>
            {project.summary && <p className="text-white/70 mb-4">{project.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
