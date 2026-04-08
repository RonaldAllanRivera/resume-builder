'use client'

import React from 'react'
import Link from 'next/link'
import { Package } from '@/payload-types'

interface PricingPageProps {
  packages: Package[]
}

export function PricingPage({ packages }: PricingPageProps) {
  return (
    <div className="min-h-screen bg-[#050608] text-white py-20 pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="mb-4 text-[clamp(2.5rem,5vw,4rem)] font-black leading-none tracking-[-0.045em] text-white">
            Hire Me
          </h1>
          <p className="text-lg text-white/60">
            Professional freelance services with transparent pricing. Choose the perfect package for
            your project needs.
          </p>
        </div>

        {/* Package Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, index) => (
            <PackageCard key={pkg.id} package={pkg} featured={index === 1} />
          ))}
        </div>

        {/* Contact Section */}
        <div className="text-center bg-white/5 backdrop-blur rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-4">Need a Custom Solution?</h2>
          <p className="text-white/80 mb-6">
            Have a project that doesn&apos;t fit these packages? Let&apos;s discuss your specific
            requirements.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 px-6 py-3 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[0_0_20px_rgba(100,180,255,0.4)]"
          >
            Contact Me
          </Link>
        </div>
      </div>
    </div>
  )
}

interface PackageCardProps {
  package: Package
  featured?: boolean
}

function PackageCard({ package: pkg, featured }: PackageCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price / 100)
  }

  return (
    <div
      className={`relative bg-white/5 backdrop-blur rounded-2xl p-8 transition-all hover:bg-white/10 ${
        featured ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#050608]' : ''
      }`}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
        <div className="text-3xl font-bold text-cyan-400 mb-2">
          {formatPrice(pkg.price, pkg.currency)}
        </div>
        <p className="text-white/70 text-sm">{pkg.shortDescription}</p>
      </div>

      {pkg.deliverables && pkg.deliverables.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">What&apos;s Included:</h4>
          <ul className="space-y-2">
            {pkg.deliverables?.map((deliverable, index) => (
              <li key={index} className="flex items-start">
                <span className="text-cyan-400 mr-2">✓</span>
                <span className="text-white/80 text-sm">
                  {typeof deliverable === 'string' ? deliverable : deliverable.item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/book/${pkg.slug}`}
        className={`w-full inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold transition-all ${
          featured
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        Book Now
      </Link>
    </div>
  )
}
