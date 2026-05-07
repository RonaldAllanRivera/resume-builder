import React from 'react'
import Link from 'next/link'

export function HomeCTA() {
  return (
    <section className="relative z-10 mx-auto my-24 w-[min(calc(100%-40px),1320px)] rounded-3xl border border-white/10 bg-black/30 p-10 text-center backdrop-blur md:p-16">
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Want to work together?
      </h2>
      <p className="mt-3 text-white/70">Pick the path that fits.</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Hiring? Email me
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Need help shipping? See services
        </Link>
      </div>
    </section>
  )
}
