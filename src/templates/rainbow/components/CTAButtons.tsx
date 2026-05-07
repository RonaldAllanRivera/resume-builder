'use client'

import React from 'react'

interface CTAButtonsProps {
  className?: string
  consultHref?: string
  bookHref?: string
}

export function CTAButtons({
  className = '',
  consultHref = '/book/30min-consultation',
  bookHref = '/services',
}: CTAButtonsProps) {
  return (
    <div className={`mt-8 flex flex-wrap gap-4 md:gap-8 ${className}`}>
      <a
        href={consultHref}
        className="inline-flex min-h-[60px] items-center justify-center rounded-2xl border border-white/15 bg-[#191a21]/90 px-7 text-base font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#191a21]/95"
      >
        BOOK A PAID CONSULTATION
      </a>
      <a
        href={bookHref}
        className="inline-flex min-h-[60px] items-center justify-center rounded-2xl bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 px-7 text-base font-extrabold text-[#111111] shadow-[0_0_30px_rgba(251,146,60,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(251,146,60,0.6)] hover:scale-105"
      >
        SEE SERVICES
      </a>
    </div>
  )
}
