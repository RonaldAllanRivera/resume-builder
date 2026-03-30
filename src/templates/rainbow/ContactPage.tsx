'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SiteSetting } from '@/payload-types'
import { Starfield } from './components/Starfield'
import { X } from 'lucide-react'

interface ContactPageProps {
  settings?: SiteSetting | null
}

export function ContactPage({ settings: _settings }: ContactPageProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    referral: '',
    honeypot: '', // Hidden field for spam protection
  })

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }

      setStatus('success')
      setFormData({
        name: '',
        email: '',
        company: '',
        message: '',
        referral: '',
        honeypot: '',
      })

      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 5000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Starfield Background */}
      <Starfield />

      {/* Close Button */}
      <button
        onClick={() => router.back()}
        className="fixed right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 hover:text-white"
        aria-label="Close and go back"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-[clamp(2.5rem,5vw,4rem)] font-black leading-none tracking-[-0.045em] text-white">
              Hire a Senior Full-Stack Developer for Your Next Project
            </h1>
            <p className="text-lg text-white/60">
              Build scalable, high-performance{' '}
              <span className="text-white/80">web, SaaS, AI, and automation solutions</span> using{' '}
              <span className="text-white/80">Python, Laravel, WordPress, React, and Next.js</span>.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Email Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs uppercase tracking-wider text-white/70"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 backdrop-blur-sm transition focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs uppercase tracking-wider text-white/70"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  disabled={status === 'loading'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 backdrop-blur-sm transition focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Company Website */}
            <div>
              <label
                htmlFor="company"
                className="mb-2 block text-xs uppercase tracking-wider text-white/70"
              >
                Company Website (Optional – helps understand your project)
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                maxLength={200}
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 backdrop-blur-sm transition focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://example.com (optional)"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-xs uppercase tracking-wider text-white/70"
              >
                Project Details (Web Development, SaaS, AI, or Automation)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                disabled={status === 'loading'}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 backdrop-blur-sm transition focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your project (e.g., WordPress site, SaaS platform, AI automation, Laravel app)..."
              />
            </div>

            {/* Referral Source */}
            <div>
              <label
                htmlFor="referral"
                className="mb-2 block text-xs uppercase tracking-wider text-white/70"
              >
                How did you find me? (Google, LinkedIn, GitHub, Referral)
              </label>
              <input
                type="text"
                id="referral"
                name="referral"
                value={formData.referral}
                onChange={handleChange}
                maxLength={200}
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 backdrop-blur-sm transition focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="LinkedIn, Google, Referral, etc. (optional)"
              />
            </div>

            {/* Honeypot (hidden field for spam protection) */}
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            {/* Status Messages */}
            {status === 'success' && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-400">
                ✓ Your message has been sent successfully! I&apos;ll get back to you soon.
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">
                ✗ {errorMessage || 'Failed to send message. Please try again.'}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {status === 'loading' ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Send
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white to-gray-200 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>

              <Link
                href="/"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10"
              >
                Back
              </Link>
            </div>
          </form>

          {/* Footer Note */}
          <p className="mt-8 text-center text-sm text-white/40">
            Your information is secure and confidential. I respond within 24 hours.
          </p>
          <p className="sr-only">
            Ronald Allan Rivera is a senior full-stack web developer specializing in Python,
            Laravel, WordPress, React, Next.js, AI automation, SaaS platforms, and high-performance
            web applications.
          </p>
        </div>
      </div>
    </div>
  )
}
