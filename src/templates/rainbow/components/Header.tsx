'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false)
  const [certificationsDropdownOpen, setCertificationsDropdownOpen] = useState(false)

  // Mobile sub-menu states
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false)
  const [mobileCertificationsOpen, setMobileCertificationsOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className="rainbow-header fixed inset-x-0 top-0 z-[9999] px-4 pt-3 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between">
          {/* Desktop spacer */}
          <div className="hidden md:block flex-1" />

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <nav
              className="flex items-center gap-2 px-3 py-1.5 rounded-[1.25rem] border border-white/5 bg-[#191a21]/90 shadow-nav backdrop-blur"
              aria-label="Main navigation"
            >
              <Link
                href="/"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-pink-400 hover:via-yellow-300 hover:to-purple-400 hover:shadow-[0_0_20px_rgba(255,200,255,0.3)]"
              >
                Home
              </Link>
              <div
                className="nav-dropdown relative"
                onMouseEnter={() => setProjectsDropdownOpen(true)}
                onMouseLeave={() => setProjectsDropdownOpen(false)}
              >
                <Link
                  href="/projects"
                  className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-red-400 hover:shadow-[0_0_20px_rgba(255,150,200,0.3)]"
                >
                  Projects
                </Link>
                {projectsDropdownOpen && (
                  <div className="nav-dropdown-menu absolute top-full left-0 mt-2 min-w-[200px] rounded-xl border border-white/10 bg-[#191a21]/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur">
                    <Link
                      href="/projects"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-red-400 hover:text-black"
                    >
                      All Projects
                    </Link>
                    <Link
                      href="/projects#full-stack"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-pink-400 hover:via-yellow-300 hover:to-purple-400 hover:text-black"
                    >
                      Full Stack
                    </Link>
                    <Link
                      href="/projects#wordpress"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-green-300 hover:via-cyan-300 hover:to-blue-400 hover:text-black"
                    >
                      WordPress
                    </Link>
                    <Link
                      href="/projects#automation"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-yellow-300 hover:via-orange-300 hover:to-red-400 hover:text-black"
                    >
                      Automation
                    </Link>
                    <Link
                      href="/projects#graphic-design"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-300 hover:via-pink-300 hover:to-indigo-400 hover:text-black"
                    >
                      Design
                    </Link>
                  </div>
                )}
              </div>
              <Link
                href="/#experience"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-green-300 hover:via-cyan-300 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(100,255,255,0.3)]"
              >
                Experience
              </Link>
              <div
                className="nav-dropdown relative"
                onMouseEnter={() => setCertificationsDropdownOpen(true)}
                onMouseLeave={() => setCertificationsDropdownOpen(false)}
              >
                <Link
                  href="/certifications"
                  className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-teal-300 hover:via-emerald-300 hover:to-green-400 hover:shadow-[0_0_20px_rgba(100,255,180,0.3)]"
                >
                  Certifications
                </Link>
                {certificationsDropdownOpen && (
                  <div className="nav-dropdown-menu absolute top-full left-0 mt-2 min-w-[250px] rounded-xl border border-white/10 bg-[#191a21]/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur">
                    <Link
                      href="/certifications"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-teal-300 hover:via-emerald-300 hover:to-green-400 hover:text-black"
                    >
                      All Certifications
                    </Link>
                    <Link
                      href="/certifications#frontend-javascript"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-pink-400 hover:via-yellow-300 hover:to-purple-400 hover:text-black"
                    >
                      Frontend & JavaScript
                    </Link>
                    <Link
                      href="/certifications#python-django"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 hover:text-black"
                    >
                      Python & AI/ML
                    </Link>
                    <Link
                      href="/certifications#laravel-backend"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-400 hover:via-red-400 hover:to-pink-400 hover:text-black"
                    >
                      Laravel & Backend
                    </Link>
                    <Link
                      href="/certifications#cloud-devops"
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-400 hover:via-sky-400 hover:to-blue-400 hover:text-black"
                    >
                      Cloud & DevOps
                    </Link>
                  </div>
                )}
              </div>
              <Link
                href="/pricing"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-amber-300 hover:via-orange-400 hover:to-red-400 hover:shadow-[0_0_20px_rgba(255,180,100,0.3)]"
              >
                Pricing
              </Link>
              <Link
                href="/search"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-300 hover:via-pink-300 hover:to-indigo-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                Search
              </Link>
              <Link
                href="/contact"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 hover:shadow-[0_0_20px_rgba(100,180,255,0.3)]"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden w-full justify-end">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#191a21]/90 p-3 text-white shadow-nav backdrop-blur transition-transform duration-200 hover:scale-105"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop spacer */}
          <div className="hidden md:block flex-1" />
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="mt-3 md:hidden">
            <nav
              className="flex flex-col rounded-[1.25rem] border border-white/5 bg-[#191a21]/95 p-2 shadow-nav backdrop-blur"
              aria-label="Mobile navigation"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-pink-400 hover:via-yellow-300 hover:to-purple-400"
              >
                Home
              </Link>

              {/* Collapsible Projects Category */}
              <button
                onClick={() => setMobileProjectsOpen(!mobileProjectsOpen)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-red-400 flex items-center justify-between"
              >
                <span>Projects</span>
                <span className="text-white/60">{mobileProjectsOpen ? '−' : '+'}</span>
              </button>
              {mobileProjectsOpen && (
                <div className="flex flex-col pl-4 space-y-1">
                  <Link
                    href="/projects"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-red-400"
                  >
                    → All Projects
                  </Link>
                  <Link
                    href="/projects#full-stack"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-pink-400 hover:via-yellow-300 hover:to-purple-400"
                  >
                    → Full Stack
                  </Link>
                  <Link
                    href="/projects#wordpress"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-green-300 hover:via-cyan-300 hover:to-blue-400"
                  >
                    → WordPress
                  </Link>
                  <Link
                    href="/projects#automation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-yellow-300 hover:via-orange-300 hover:to-red-400"
                  >
                    → Automation
                  </Link>
                  <Link
                    href="/projects#graphic-design"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-300 hover:via-pink-300 hover:to-indigo-400"
                  >
                    → Design
                  </Link>
                </div>
              )}

              <Link
                href="/#experience"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-green-300 hover:via-cyan-300 hover:to-blue-400"
              >
                Experience
              </Link>

              {/* Collapsible Certifications Category */}
              <button
                onClick={() => setMobileCertificationsOpen(!mobileCertificationsOpen)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-teal-300 hover:via-emerald-300 hover:to-green-400 flex items-center justify-between"
              >
                <span>Certifications</span>
                <span className="text-white/60">{mobileCertificationsOpen ? '−' : '+'}</span>
              </button>
              {mobileCertificationsOpen && (
                <div className="flex flex-col pl-4 space-y-1">
                  <Link
                    href="/certifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-teal-300 hover:via-emerald-300 hover:to-green-400"
                  >
                    → All Certifications
                  </Link>
                  <Link
                    href="/certifications#frontend-javascript"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-pink-400 hover:via-yellow-300 hover:to-purple-400"
                  >
                    → Frontend & JavaScript
                  </Link>
                  <Link
                    href="/certifications#python-django"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400"
                  >
                    → Python & AI/ML
                  </Link>
                  <Link
                    href="/certifications#laravel-backend"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-orange-400 hover:via-red-400 hover:to-pink-400"
                  >
                    → Laravel & Backend
                  </Link>
                  <Link
                    href="/certifications#cloud-devops"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-cyan-400 hover:via-sky-400 hover:to-blue-400"
                  >
                    → Cloud & DevOps
                  </Link>
                </div>
              )}

              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-amber-300 hover:via-orange-400 hover:to-red-400"
              >
                Pricing
              </Link>

              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-300 hover:via-pink-300 hover:to-indigo-400"
              >
                Search
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 rounded-xl px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(100,180,255,0.2)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(100,180,255,0.4)]"
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
