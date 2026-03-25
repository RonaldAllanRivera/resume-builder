'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              <a
                href="#services"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400 hover:shadow-[0_0_20px_rgba(255,180,100,0.3)]"
              >
                Featured Work
              </a>
              <a
                href="#projects"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-red-400 hover:shadow-[0_0_20px_rgba(255,150,200,0.3)]"
              >
                Projects
              </a>
              <a
                href="#experience"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-green-300 hover:via-cyan-300 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(100,255,255,0.3)]"
              >
                Experience
              </a>
              <a
                href="#education"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 hover:shadow-[0_0_20px_rgba(150,150,255,0.3)]"
              >
                Education
              </a>
              <a
                href="#certifications"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-teal-300 hover:via-emerald-300 hover:to-green-400 hover:shadow-[0_0_20px_rgba(100,255,180,0.3)]"
              >
                Certifications
              </a>
              <a
                href="#contact"
                className="nav-link rounded-[0.9rem] mx-[2px] px-5 py-3 text-[1.05rem] font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-cyan-300 hover:via-sky-300 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(100,200,255,0.3)]"
              >
                Contact
              </a>
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
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-yellow-400 hover:via-orange-400 hover:to-pink-400"
              >
                Featured Work
              </a>
              <a
                href="#projects"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-red-400"
              >
                Projects
              </a>
              <a
                href="#experience"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-green-300 hover:via-cyan-300 hover:to-blue-400"
              >
                Experience
              </a>
              <a
                href="#education"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400"
              >
                Education
              </a>
              <a
                href="#certifications"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-teal-300 hover:via-emerald-300 hover:to-green-400"
              >
                Certifications
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-link rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:text-black hover:bg-gradient-to-r hover:from-cyan-300 hover:via-sky-300 hover:to-blue-400"
              >
                Contact
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
