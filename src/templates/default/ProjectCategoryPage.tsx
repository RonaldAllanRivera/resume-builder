'use client'

import React, { useState } from 'react'
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

function ProjectCard({ project }: { project: Project }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className="border rounded-lg p-6 hover:shadow-lg transition-all">
      {/* Category Tag */}
      <div className="mb-3">
        <span className="text-xs text-gray-500">{project.category}</span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mb-3">{project.title}</h2>

      {/* Summary */}
      <p className="text-gray-600 mb-4 text-sm leading-relaxed">{project.summary}</p>

      {/* Tech Stack */}
      {project.techStack && project.techStack.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Content */}
      {project.content && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isExpanded ? 'Show Less' : 'Full Description'}
          </button>
          {isExpanded && (
            <div className="mt-3 text-sm text-gray-700 prose prose-sm max-w-none">
              {typeof project.content === 'string' ? (
                <p>{project.content}</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: JSON.stringify(project.content) }} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Links */}
      <div className="mt-4 flex gap-3">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            View Live Site
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
          >
            View Code
          </a>
        )}
      </div>
    </article>
  )
}

export function ProjectCategoryPage({ category, projects }: ProjectCategoryPageProps) {
  const label = categoryLabels[category] || category

  // Sort projects by order (descending - newest first)
  const sortedProjects =
    projects?.slice().sort((a, b) => {
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      return orderB - orderA // Descending order (highest order number first)
    }) || []

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-4xl font-bold mb-6">{label}</h1>
      <p className="text-sm text-gray-600 mb-12">
        {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''} in this category
      </p>
      {sortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No projects in this category.</p>
      )}
    </div>
  )
}
