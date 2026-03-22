import React from 'react'
import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'

interface NavigationProps {
  settings?: SiteSetting | null
}

export function Navigation({ settings }: NavigationProps) {
  const showExperience = settings?.showExperience ?? true
  const showEducation = settings?.showEducation ?? true
  const showProjects = settings?.showProjects ?? true
  const showCertifications = settings?.showCertifications ?? true

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <ul className="flex gap-6">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          {showExperience && (
            <li>
              <Link href="/experience" className="hover:underline">
                Experience
              </Link>
            </li>
          )}
          {showEducation && (
            <li>
              <Link href="/education" className="hover:underline">
                Education
              </Link>
            </li>
          )}
          {showProjects && (
            <li className="relative group">
              <Link href="/projects" className="hover:underline inline-block py-1">
                Projects
              </Link>
              <ul className="absolute hidden group-hover:block bg-white border shadow-lg pt-1 top-full left-0 min-w-[250px] z-50">
                <li>
                  <Link
                    href="/projects/full-stack"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-900"
                  >
                    Full Stack Development
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects/wordpress"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-900"
                  >
                    WordPress Development
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects/automation"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-900"
                  >
                    Automation & Software Engineering
                  </Link>
                </li>
                <li>
                  <Link
                    href="/projects/graphic-design"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-900"
                  >
                    Graphic Design
                  </Link>
                </li>
              </ul>
            </li>
          )}
          {showCertifications && (
            <li>
              <Link href="/certifications" className="hover:underline">
                Certifications
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
