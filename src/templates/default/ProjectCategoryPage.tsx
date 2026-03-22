import React from 'react'
import Link from 'next/link'
import type { Project, SiteSetting } from '@/payload-types'

interface ProjectCategoryPageProps {
  category: string
  projects?: Project[]
  settings?: SiteSetting | null
}

const categoryLabels: Record<string, string> = {
  'full-stack': 'Full Stack Development',
  wordpress: 'WordPress Development',
  automation: 'Automation & Software Engineering',
  'graphic-design': 'Graphic Design',
}

export function ProjectCategoryPage({ category, projects }: ProjectCategoryPageProps) {
  const label = categoryLabels[category] || category

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{label}</h1>
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.slug}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
              <p className="text-gray-600">{project.summary}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No projects in this category.</p>
      )}
    </div>
  )
}
