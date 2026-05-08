'use client'

import React, { useState } from 'react'
import type { Experience } from '@/payload-types'
import { ScrollReveal } from './ScrollReveal'

interface ExperienceProps {
  experiences: Experience[]
}

export function Experience({ experiences }: ExperienceProps) {
  const [showEarlier, setShowEarlier] = useState(false)

  if (!experiences || experiences.length === 0) return null

  // Filter current (present) and earlier experiences
  const currentExperiences = experiences.filter((exp) => exp.current === true)
  const earlierExperiences = experiences.filter((exp) => exp.current !== true)

  return (
    <section id="experience" className="scroll-mt-24 py-16 overflow-x-clip">
      <div className="mx-auto w-[min(calc(100%-40px),1320px)]">
        <ScrollReveal
          className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          threshold={0.5}
          delay={0.2}
        >
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Experience
          </h2>
        </ScrollReveal>

        {/* Current Experiences */}
        <div className="relative grid gap-4 before:absolute before:bottom-0 before:left-7 before:top-0 before:w-px before:bg-white/10 before:content-[''] max-sm:before:left-4">
          {currentExperiences.map((exp, index) => (
            <ScrollReveal
              key={exp.id}
              direction={index % 2 === 0 ? 'left' : 'right'}
              threshold={0.1}
              delay={0.1}
            >
              <article className="grid gap-[18px] rounded-[24px] border border-white/10 bg-card-bg p-[22px] sm:grid-cols-[72px_1fr] max-sm:grid-cols-[44px_1fr] max-sm:p-[18px] relative z-[100]">
                <div className="relative z-[1] mx-auto mt-2 h-[18px] w-[18px] rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 shadow-[0_0_0_10px_rgba(255,180,100,0.12)]"></div>
                <div>
                  <small className="mb-2 block uppercase tracking-[0.08em] text-yellow-400">
                    Current
                  </small>
                  <h3 className="mb-2 text-[1.4rem] font-bold text-white">{exp.title}</h3>
                  {exp.company && (
                    <p className="mb-2 text-sm text-white/75">
                      {exp.company}
                      {exp.location && ` • ${exp.location}`}
                    </p>
                  )}
                  {(exp.startDate || exp.endDate) && (
                    <p className="mb-3 text-xs text-white/60">
                      {exp.startDate &&
                        new Date(exp.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      {exp.startDate && exp.endDate && ' - '}
                      {exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : exp.startDate && ' - Present'}
                    </p>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-3.5 list-disc pl-[18px] text-white/65">
                      {exp.highlights.map((highlight, idx) => {
                        const text =
                          typeof highlight === 'object' && highlight !== null && 'text' in highlight
                            ? highlight.text
                            : String(highlight)
                        return <li key={idx}>{text}</li>
                      })}
                    </ul>
                  )}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Show Earlier Jobs Button */}
        {earlierExperiences.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowEarlier(!showEarlier)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#191a21]/90 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-[#191a21]/95"
            >
              {showEarlier
                ? 'Hide Earlier Jobs'
                : `Show Earlier Jobs (${earlierExperiences.length})`}
              <svg
                className={`h-4 w-4 transition-transform ${showEarlier ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Earlier Experiences - Collapsible */}
        {showEarlier && earlierExperiences.length > 0 && (
          <div className="mt-6 relative grid gap-4 before:absolute before:bottom-0 before:left-7 before:top-0 before:w-px before:bg-white/10 before:content-[''] max-sm:before:left-4">
            {earlierExperiences.map((exp, index) => (
              <ScrollReveal
                key={exp.id}
                direction={index % 2 === 0 ? 'left' : 'right'}
                threshold={0.1}
                delay={0.1}
              >
                <article className="grid gap-[18px] rounded-[24px] border border-white/10 bg-card-bg p-[22px] sm:grid-cols-[72px_1fr] max-sm:grid-cols-[44px_1fr] max-sm:p-[18px] relative z-[100]">
                  <div className="relative z-[1] mx-auto mt-2 h-[18px] w-[18px] rounded-full bg-gradient-to-r from-orange-400 to-pink-400 shadow-[0_0_0_10px_rgba(255,140,100,0.12)]"></div>
                  <div>
                    <small className="mb-2 block uppercase tracking-[0.08em] text-orange-400">
                      Earlier
                    </small>
                    <h3 className="mb-2 text-[1.4rem] font-bold text-white">{exp.title}</h3>
                    {exp.company && (
                      <p className="mb-2 text-sm text-white/75">
                        {exp.company}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                    )}
                    {(exp.startDate || exp.endDate) && (
                      <p className="mb-3 text-xs text-white/60">
                        {exp.startDate &&
                          new Date(exp.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        {exp.startDate && exp.endDate && ' - '}
                        {exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : exp.startDate && ' - Present'}
                      </p>
                    )}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="mt-3.5 list-disc pl-[18px] text-white/65">
                        {exp.highlights.map((highlight, idx) => {
                          const text =
                            typeof highlight === 'object' &&
                            highlight !== null &&
                            'text' in highlight
                              ? highlight.text
                              : String(highlight)
                          return <li key={idx}>{text}</li>
                        })}
                      </ul>
                    )}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
