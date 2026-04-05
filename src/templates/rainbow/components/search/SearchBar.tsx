'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPopularSearches } from '@/utilities/search'

interface SearchBarProps {
  onSearch?: (query: string) => void
  autoFocus?: boolean
  placeholder?: string
}

export function SearchBar({ onSearch, autoFocus = false, placeholder }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const popularSearches = getPopularSearches()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim())
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  const handlePopularClick = (term: string) => {
    setQuery(term)
    if (onSearch) {
      onSearch(term)
    } else {
      router.push(`/search?q=${encodeURIComponent(term)}`)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <svg
              className="h-5 w-5 text-white/40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder || 'Search React, Next.js, Laravel, WordPress, AI automation...'}
            autoFocus={autoFocus}
            className="block w-full rounded-2xl border border-white/10 bg-[#191a21]/80 py-4 pl-12 pr-32 text-base text-white placeholder-white/40 shadow-lg backdrop-blur transition-all duration-300 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center rounded-r-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-8 text-sm font-bold text-white transition-all duration-300 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Search
          </button>
        </div>
      </form>

      {/* Popular Searches */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-white/60">Popular:</span>
        {popularSearches.map((term) => (
          <button
            key={term}
            onClick={() => handlePopularClick(term)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur transition-all duration-200 hover:border-purple-400/50 hover:bg-purple-400/10 hover:text-white"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  )
}
