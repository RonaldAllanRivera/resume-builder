import React from 'react'
import { Navigation } from './Navigation'
import { Footer } from './Footer'
import { getSiteSettings } from '@/utilities/getTemplate'

export async function Layout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
