import React from 'react'
import type { Project } from '@/payload-types'
import {
  techStackIcons,
  getDynamicIconPosition,
  extractTechFromDescription,
  getFallbackIcons,
} from '@/utilities/techStackIcons'

interface FeaturedWorkProps {
  projects: Project[]
}

// Gradient variants for visual variety
const gradients = [
  'from-purple-900/20 via-blue-900/20 to-pink-900/20',
  'from-cyan-900/20 via-teal-900/20 to-emerald-900/20',
  'from-orange-900/20 via-red-900/20 to-pink-900/20',
  'from-blue-900/20 via-indigo-900/20 to-purple-900/20',
  'from-green-900/20 via-cyan-900/20 to-blue-900/20',
]

export function FeaturedWork({ projects }: FeaturedWorkProps) {
  if (!projects || projects.length === 0) return null

  const firstTwo = projects.slice(0, 2)
  const remaining = projects.slice(2)

  return (
    <section id="services" className="scroll-mt-24 py-16">
      <div className="mx-auto w-[min(calc(100%-40px),1320px)]">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Featured work
          </h2>
        </div>

        {/* First Two Projects - Asymmetric Grid */}
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          {firstTwo.map((project, index) => (
            <article
              key={project.id}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0b0f]/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur"
            >
              {/* Project Image with Floating Tech Stack Icons */}
              <div
                className={`relative aspect-[16/10] border-b border-white/5 bg-gradient-to-br ${gradients[index % gradients.length]}`}
              >
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.38))]" />

                {/* Floating Tech Stack Icons */}
                {(() => {
                  // Get valid icons from tech stack and normalize to string array
                  const validIconNames = (project.techStack || [])
                    .map((tech) =>
                      typeof tech === 'object' && tech !== null && 'name' in tech
                        ? tech.name
                        : String(tech),
                    )
                    .filter((techName) => techStackIcons[techName])

                  // If less than 3 icons, try to extract from description
                  let iconsToShow = [...validIconNames]
                  if (iconsToShow.length < 3) {
                    const descriptionTech = extractTechFromDescription(project.summary || '')
                    const additionalIcons = descriptionTech.filter(
                      (tech) => !iconsToShow.includes(tech),
                    )
                    iconsToShow = [...iconsToShow, ...additionalIcons]
                  }

                  // If still less than 3, add fallback generic icons
                  if (iconsToShow.length < 3) {
                    const fallbacks = getFallbackIcons(3 - iconsToShow.length)
                    iconsToShow = [...iconsToShow, ...fallbacks]
                  }

                  return iconsToShow.slice(0, 10).map((techName, techIndex) => {
                    const Icon = techStackIcons[techName]
                    if (!Icon) return null

                    const position = getDynamicIconPosition(
                      Math.min(iconsToShow.length, 10),
                      techIndex,
                    )

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
                          transform:
                            `${position.transform || ''} rotate(${position.rotation}deg)`.trim(),
                        }}
                      />
                    )
                  })
                })()}

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
              <div className="p-6">
                <p className="text-white/60">{project.summary}</p>

                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="mt-[18px] flex flex-wrap gap-2.5">
                    {project.techStack.slice(0, 4).map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-2 text-[0.82rem] text-white/70"
                      >
                        {typeof tech === 'object' && tech !== null && 'name' in tech
                          ? tech.name
                          : String(tech)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Open Link Button */}
                {(project.liveUrl || project.repoUrl) && (
                  <div className="mt-4">
                    <a
                      href={(project.liveUrl || project.repoUrl) ?? ''}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
                    >
                      {project.liveUrl ? 'View Live' : 'View Code'}
                    </a>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Remaining Projects - 3 Column Grid */}
        {remaining.length > 0 && (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {remaining.map((project, index) => (
              <article
                key={project.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0b0f]/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur"
              >
                {/* Project Image with Floating Tech Stack Icons */}
                <div
                  className={`relative aspect-[16/10] border-b border-white/5 bg-gradient-to-br ${gradients[(index + 2) % gradients.length]}`}
                >
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.38))]" />

                  {/* Floating Tech Stack Icons */}
                  {(() => {
                    // Get valid icons from tech stack and normalize to string array
                    const validIconNames = (project.techStack || [])
                      .map((tech) =>
                        typeof tech === 'object' && tech !== null && 'name' in tech
                          ? tech.name
                          : String(tech),
                      )
                      .filter((techName) => techStackIcons[techName])

                    // If less than 3 icons, try to extract from description
                    let iconsToShow = [...validIconNames]
                    if (iconsToShow.length < 3) {
                      const descriptionTech = extractTechFromDescription(project.summary || '')
                      const additionalIcons = descriptionTech.filter(
                        (tech) => !iconsToShow.includes(tech),
                      )
                      iconsToShow = [...iconsToShow, ...additionalIcons]
                    }

                    // If still less than 3, add fallback generic icons
                    if (iconsToShow.length < 3) {
                      const fallbacks = getFallbackIcons(3 - iconsToShow.length)
                      iconsToShow = [...iconsToShow, ...fallbacks]
                    }

                    return iconsToShow.slice(0, 10).map((techName, techIndex) => {
                      const Icon = techStackIcons[techName]
                      if (!Icon) return null

                      const position = getDynamicIconPosition(
                        Math.min(iconsToShow.length, 10),
                        techIndex,
                        0.7, // Smaller icons for 3-column grid cards
                      )

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
                            transform:
                              `${position.transform || ''} rotate(${position.rotation}deg)`.trim(),
                          }}
                        />
                      )
                    })
                  })()}

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
                <div className="p-6">
                  <p className="text-white/60">{project.summary}</p>

                  {/* Tech Stack */}
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="mt-[18px] flex flex-wrap gap-2.5">
                      {project.techStack.slice(0, 4).map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-2 text-[0.82rem] text-white/70"
                        >
                          {typeof tech === 'object' && tech !== null && 'name' in tech
                            ? tech.name
                            : String(tech)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Open Link Button */}
                  {(project.liveUrl || project.repoUrl) && (
                    <div className="mt-4">
                      <a
                        href={(project.liveUrl || project.repoUrl) ?? ''}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
                      >
                        {project.liveUrl ? 'View Live' : 'View Code'}
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
