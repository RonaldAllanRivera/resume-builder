import React from 'react'
import type { Education, Certification } from '@/payload-types'

interface EducationProps {
  educations: Education[]
  certifications?: Certification[]
}

export function Education({ educations, certifications }: EducationProps) {
  if (!educations || educations.length === 0) return null

  // Calculate top skills from certifications based on total hours
  const getTopSkills = () => {
    if (!certifications || certifications.length === 0) return []

    const categoryLabels: Record<string, string> = {
      'frontend-javascript': 'Frontend & JavaScript',
      'laravel-backend': 'Laravel & Backend',
      'python-django': 'Python & Django',
      wordpress: 'WordPress',
      'ai-ml': 'AI & Machine Learning',
      'cloud-devops': 'Cloud, DevOps & Architecture',
      'git-collaboration': 'Git & Collaboration',
      'video-creative': 'Video & Creative',
      'general-dev': 'General Development',
    }

    // Group certifications by category and calculate total hours
    const skillHours: Record<string, { label: string; totalHours: number; count: number }> = {}

    certifications.forEach((cert) => {
      const category = cert.category || 'general-dev'
      const label = categoryLabels[category] || category

      // Parse duration to extract hours (e.g., "1h 32m" -> 1.53)
      let hours = 0
      if (cert.duration) {
        const hourMatch = cert.duration.match(/(\d+)h/)
        const minMatch = cert.duration.match(/(\d+)m/)
        if (hourMatch) hours += parseInt(hourMatch[1])
        if (minMatch) hours += parseInt(minMatch[1]) / 60
      }

      if (!skillHours[category]) {
        skillHours[category] = { label, totalHours: 0, count: 0 }
      }
      skillHours[category].totalHours += hours
      skillHours[category].count += 1
    })

    // Sort by total hours and return top skills
    return Object.values(skillHours)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 6)
  }

  const topSkills = getTopSkills()

  return (
    <section id="education" className="scroll-mt-24 py-16">
      <div className="mx-auto w-[min(calc(100%-40px),1320px)]">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em] text-white">
            Education
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Formal Education */}
          {educations.map((edu) => (
            <article
              key={edu.id}
              className="grid gap-[18px] rounded-[24px] border border-white/10 bg-card-bg p-[22px] sm:grid-cols-[72px_1fr] max-sm:grid-cols-[44px_1fr] max-sm:p-[18px] relative z-[100]"
            >
              <div className="relative z-[1] mx-auto mt-2 h-[18px] w-[18px] rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 shadow-[0_0_0_10px_rgba(59,130,246,0.12)]"></div>
              <div>
                <small className="mb-2 block uppercase tracking-[0.08em] text-blue-400">
                  Education
                </small>
                <h3 className="mb-2 text-[1.4rem] font-bold text-white">{edu.school}</h3>
                {edu.degree && <p className="mb-2 text-sm text-white/75">{edu.degree}</p>}
                {edu.fieldOfStudy && (
                  <p className="mb-2 text-sm text-white/75">{edu.fieldOfStudy}</p>
                )}
                {edu.location && <small className="text-white/60">{edu.location}</small>}
                {(edu.startDate || edu.endDate) && (
                  <p className="mt-2 text-xs text-white/60">
                    {edu.startDate && new Date(edu.startDate).getFullYear()}
                    {edu.startDate && edu.endDate && ' - '}
                    {edu.endDate ? new Date(edu.endDate).getFullYear() : edu.startDate && 'Present'}
                  </p>
                )}
              </div>
            </article>
          ))}

          {/* Continuous Professional Learning */}
          <article className="grid gap-[18px] rounded-[24px] border border-white/10 bg-card-bg p-[22px] sm:grid-cols-[72px_1fr] max-sm:grid-cols-[44px_1fr] max-sm:p-[18px] relative z-[100]">
            <div className="relative z-[1] mx-auto mt-2 h-[18px] w-[18px] rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 shadow-[0_0_0_10px_rgba(52,211,153,0.12)]"></div>
            <div>
              <small className="mb-2 block uppercase tracking-[0.08em] text-green-400">
                Learning
              </small>
              <h3 className="mb-2 text-[1.4rem] font-bold text-white">
                Continuous Professional Learning
              </h3>
              <p className="mb-3 text-white/75">
                Self-driven training in modern frameworks, CMS systems, SaaS architecture, and
                full-stack development.
              </p>
              {topSkills.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {topSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-card-bg px-3 py-1.5 text-xs font-medium text-white/90"
                    >
                      {skill.label}
                      <span className="text-yellow-400">
                        {skill.totalHours > 0 && `${Math.round(skill.totalHours)}h`}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <small className="text-white/60">Ongoing</small>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
