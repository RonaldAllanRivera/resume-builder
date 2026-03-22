import React from 'react'
import Link from 'next/link'
import type { Project, SiteSetting } from '@/payload-types'

interface ProjectsPageProps {
  projects?: Project[]
  settings?: SiteSetting | null
}

export function ProjectsPage({ projects }: ProjectsPageProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">All Projects</h1>
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.slug}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
              <p className="text-sm text-gray-500 mb-2">{project.category}</p>
              <p className="text-gray-600">{project.summary}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No projects available.</p>
      )}
    </div>
  )
}
