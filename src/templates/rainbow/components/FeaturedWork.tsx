import React from 'react'
import type { Project } from '@/payload-types'

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

const innerGradients = [
  'from-purple-500/5 via-blue-500/5 to-pink-500/5',
  'from-cyan-500/5 via-teal-500/5 to-emerald-500/5',
  'from-orange-500/5 via-red-500/5 to-pink-500/5',
  'from-blue-500/5 via-indigo-500/5 to-purple-500/5',
  'from-green-500/5 via-cyan-500/5 to-blue-500/5',
]

export function FeaturedWork({ projects }: FeaturedWorkProps) {
  if (!projects || projects.length === 0) return null

  const firstTwo = projects.slice(0, 2)
  const remaining = projects.slice(2)

  return (
    <section id="services" className="py-16">
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
              {/* Project Image Placeholder */}
              <div
                className={`relative aspect-[16/10] border-b border-white/5 bg-gradient-to-br ${gradients[index % gradients.length]}`}
              >
                <div
                  className={`absolute inset-5 rounded-[20px] border border-white/10 bg-gradient-to-br ${innerGradients[index % innerGradients.length]}`}
                />
              </div>

              {/* Project Content */}
              <div className="p-6">
                <span className="mb-3.5 inline-flex text-[0.84rem] uppercase tracking-[0.08em] text-cyan-400">
                  {index === 0 ? 'Featured project' : project.category?.replace('-', ' ')}
                </span>
                <h3 className="mb-2.5 text-[clamp(1.35rem,3vw,2rem)] leading-[1.05] tracking-[-0.04em] text-white">
                  {project.title}
                </h3>
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
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
                    >
                      Open Link
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
                {/* Project Image Placeholder */}
                <div
                  className={`relative aspect-[16/10] border-b border-white/5 bg-gradient-to-br ${gradients[(index + 2) % gradients.length]}`}
                >
                  <div
                    className={`absolute inset-5 rounded-[20px] border border-white/10 bg-gradient-to-br ${innerGradients[(index + 2) % innerGradients.length]}`}
                  />
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <span className="mb-3.5 inline-flex text-[0.84rem] uppercase tracking-[0.08em] text-cyan-400">
                    {project.category?.replace('-', ' ')}
                  </span>
                  <h3 className="mb-2.5 text-[clamp(1.35rem,3vw,2rem)] leading-[1.05] tracking-[-0.04em] text-white">
                    {project.title}
                  </h3>
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
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_20px_rgba(255,180,100,0.3)] transition hover:shadow-[0_0_30px_rgba(255,180,100,0.5)]"
                      >
                        Open Link
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
