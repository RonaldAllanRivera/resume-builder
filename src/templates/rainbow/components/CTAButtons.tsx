'use client'

import React from 'react'

interface CTAButtonsProps {
  className?: string
  chatHref?: string
  bookHref?: string
}

export function CTAButtons({
  className = '',
  chatHref = '/contact',
  bookHref = '/contact',
}: CTAButtonsProps) {
  return (
    <div className={`mt-8 flex flex-wrap gap-4 ${className}`}>
      <a
        href={chatHref}
        className="inline-flex min-h-[60px] items-center justify-center rounded-2xl bg-white px-7 text-base font-extrabold text-[#111111] shadow-nav transition hover:-translate-y-0.5"
      >
        CONTACT ME
      </a>
      <a
        href={bookHref}
        className="inline-flex min-h-[60px] items-center justify-center rounded-2xl border border-white/15 bg-[#191a21]/90 px-7 text-base font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#191a21]/95"
      >
        BOOK ME NOW
      </a>
    </div>
  )
}
