import React from 'react'
import type { Project } from '@/payload-types'
import {
  techStackIcons,
  getDynamicIconPosition,
  extractTechFromDescription,
  getFallbackIcons,
} from '@/utilities/techStackIcons'

interface ProjectCardProps {
  project: Project
  gradient: string
}

export function ProjectCard({ project, gradient }: ProjectCardProps) {
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
    <article
      data-version="v2-unified"
      className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#11131a] shadow-[0_18px_50px_rgba(0,0,0,0.32)]"
    >
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

        {/* Tech Stack Badges */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, index) => {
              const techName =
                typeof tech === 'object' && tech !== null && 'name' in tech
                  ? tech.name
                  : String(tech)
              return (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90"
                >
                  {techName}
                </span>
              )
            })}
          </div>
        )}

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
        </div>
      </div>
    </article>
  )
}
