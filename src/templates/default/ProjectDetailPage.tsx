import React from 'react'
import type { Project, SiteSetting } from '@/payload-types'

interface ProjectDetailPageProps {
  slug: string
  project?: Project | null
  settings?: SiteSetting | null
}

export function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Project Not Found</h1>
        <p className="text-gray-600">The requested project could not be found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{project.category}</p>

      {project.summary && <p className="text-lg text-gray-700 mb-8">{project.summary}</p>}

      {project.techStack && project.techStack.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, index) => (
              <span key={index} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            referrerPolicy="no-referrer"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Repository
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            referrerPolicy="no-referrer"
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            View Live Site
          </a>
        )}
      </div>
    </div>
  )
}
