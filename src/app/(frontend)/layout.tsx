import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { StarfieldClient } from '@/components/StarfieldClient'

import './globals.css'
import { getCanonicalURL } from '@/utilities/getURL'

// Font optimization: Prevent invisible text during font loading
const fontOptimizationStyles = `
  @font-face {
    font-display: swap;
  }
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <style dangerouslySetInnerHTML={{ __html: fontOptimizationStyles }} />
        {/* Resource hints for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link href="/favicon.ico" rel="icon" sizes="any" />
        <link href="/favicon-16x16.png" rel="icon" type="image/png" sizes="16x16" />
        <link href="/favicon-32x32.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
        <link href="/site.webmanifest" rel="manifest" />
      </head>
      <body className="relative bg-black">
        {/* Persistent Starfield background - covers entire viewport, continues across page navigation */}
        <StarfieldClient />

        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalURL()),
  // Relative canonicals resolve against metadataBase, so the host comes from
  // exactly one place. Per-route pages override this with their own path.
  alternates: { canonical: '/' },
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    // `creator` is intentionally absent. It used to say '@payloadcms' — the
    // starter template's handle — which credited Payload on every share. It is
    // omitted rather than guessed: a wrong handle credits a stranger, which is
    // worse than none. Add Allan's real X handle here when known.
  },
}
