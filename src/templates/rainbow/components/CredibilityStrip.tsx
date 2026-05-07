import React from 'react'

const ITEMS = [
  { label: 'Lighthouse 99', href: 'https://pagespeed.web.dev/' },
  { label: 'TypeScript', href: null },
  {
    label: 'Open source ↗',
    href: 'https://github.com/RonaldAllanRivera/resume-builder',
  },
] as const

export function CredibilityStrip() {
  return (
    <section
      aria-label="Site credibility"
      className="border-y border-white/10 bg-black/20 py-3 text-center text-xs uppercase tracking-[0.2em] text-white/60"
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {ITEMS.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
