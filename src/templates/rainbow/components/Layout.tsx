import React from 'react'
import { Header } from './Header'
import { BackToTop } from './BackToTop'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div data-theme="dark" className="min-h-screen text-white bg-[#050608]">
      <Header />

      {/* Main content - no padding since Hero is full-height */}
      <main>{children}</main>

      {/* Back to Top Button */}
      <BackToTop />

      {/* Optional: Add footer here if needed */}
    </div>
  )
}
