'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from './components/search/SearchBar'
import { SearchResults } from './components/search/SearchResults'
import { StarfieldClient } from '@/components/StarfieldClient'
import { Header } from './components/Header'
import type { SearchResponse } from '@/utilities/search'

export function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'projects' | 'certifications' | 'experience'
  >('all')

  const performSearch = useCallback(
    async (query: string, retryCount = 0) => {
      if (!query.trim()) {
        setResults(null)
        // Clear URL when search is empty
        router.push('/search', { scroll: false })
        return
      }

      // Update URL with search query for bookmarking
      router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false })

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()

          if (response.status === 429) {
            // Don't log rate limit errors - they'll be retried automatically
            throw new Error('RATE_LIMIT')
          }

          console.error('API Error:', response.status, response.statusText, errorText)
          throw new Error(`Server error: ${response.status}`)
        }

        const data: SearchResponse = await response.json()
        setResults(data)
      } catch (err) {
        let errorMessage = 'Failed to search. Please try again.'

        if (err instanceof Error) {
          if (err.message === 'RATE_LIMIT') {
            errorMessage = 'Too many requests. Please wait a moment and try again.'
            // Retry with exponential backoff for rate limit
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
              console.log(`Rate limited. Retrying in ${delay / 1000}s...`)
              setTimeout(() => performSearch(query, retryCount + 1), delay)
              return
            }
          } else if (
            err.message.includes('Failed to fetch') ||
            err.message.includes('NetworkError')
          ) {
            errorMessage = 'Network error. Please check your connection and try again.'
            // Retry once for network errors
            if (retryCount === 0) {
              console.log('Retrying search due to network error...')
              setTimeout(() => performSearch(query, 1), 1000)
              return
            }
          } else if (err.message.includes('Server error')) {
            errorMessage = 'Server error. Please try again in a moment.'
          }
        }

        console.error('Search error:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [router],
  )

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  const filterTabs = [
    { id: 'all' as const, label: 'All', count: results?.totalResults || 0 },
    { id: 'projects' as const, label: 'Projects', count: results?.counts.projects || 0 },
    {
      id: 'certifications' as const,
      label: 'Certifications',
      count: results?.counts.certifications || 0,
    },
    { id: 'experience' as const, label: 'Experience', count: results?.counts.experiences || 0 },
  ]

  return (
    <div className="relative min-h-screen bg-[#050608]">
      {/* Starfield Background */}
      <StarfieldClient />

      {/* Header Navigation */}
      <Header />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="px-4 pb-12 pt-32 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              Search My Work
            </h1>
            <p className="mb-8 text-lg text-white/70 sm:text-xl">
              Find projects, experience, certifications, and technical skills in one place.
            </p>

            {/* Search Bar */}
            <SearchBar
              onSearch={performSearch}
              autoFocus
              placeholder="Search React, Next.js, Laravel, WordPress, AI automation..."
            />
          </div>
        </section>

        {/* Filter Tabs */}
        {results && (
          <section className="px-4 pb-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-wrap justify-center gap-3">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 ${
                      activeFilter === tab.id
                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
                        : 'border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 ${activeFilter === tab.id ? 'text-white/90' : 'text-white/60'}`}
                      >
                        ({tab.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        <section className="px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SearchResults
              results={results}
              isLoading={isLoading}
              error={error}
              activeFilter={activeFilter}
              onSearch={performSearch}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
