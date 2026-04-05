'use client'

import { SearchResultCard } from './SearchResultCard'
import type { SearchResponse } from '@/utilities/search'

interface SearchResultsProps {
  results: SearchResponse | null
  isLoading: boolean
  error: string | null
  activeFilter: 'all' | 'projects' | 'certifications' | 'experience'
}

export function SearchResults({ results, isLoading, error, activeFilter }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white/60">Searching...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-sm">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!results) {
    return null
  }

  const { projects, certifications, experiences } = results.results
  const { totalResults } = results

  if (totalResults === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
        <svg
          className="mx-auto mb-4 h-16 w-16 text-white/20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="mb-2 text-xl font-bold text-white">No results found</h3>
        <p className="mb-4 text-white/60">Try searching for:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['React', 'Next.js', 'Laravel', 'WordPress', 'Python', 'AI', 'Certifications'].map(
            (term) => (
              <span key={term} className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/80">
                {term}
              </span>
            ),
          )}
        </div>
      </div>
    )
  }

  const filteredExperiences =
    activeFilter === 'all' || activeFilter === 'experience' ? experiences : []
  const filteredProjects = activeFilter === 'all' || activeFilter === 'projects' ? projects : []
  const filteredCertifications =
    activeFilter === 'all' || activeFilter === 'certifications' ? certifications : []

  let cardIndex = 0

  return (
    <div className="space-y-12">
      {/* Results Count */}
      <div className="text-center">
        <p className="text-lg text-white/80">
          Found <span className="font-bold text-purple-400">{totalResults}</span> result
          {totalResults !== 1 ? 's' : ''} for{' '}
          <span className="font-bold text-white">&ldquo;{results.query}&rdquo;</span>
        </p>
      </div>

      {/* Project Results */}
      {filteredProjects.length > 0 && (
        <section>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 text-sm font-bold text-white">
              {filteredProjects.length}
            </span>
            Projects
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((result) => (
              <SearchResultCard key={result.id} result={result} gradientIndex={cardIndex++} />
            ))}
          </div>
        </section>
      )}

      {/* Certification Results */}
      {filteredCertifications.length > 0 && (
        <section>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-bold text-white">
              {filteredCertifications.length}
            </span>
            Certifications
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCertifications.map((result) => (
              <SearchResultCard key={result.id} result={result} gradientIndex={cardIndex++} />
            ))}
          </div>
        </section>
      )}

      {/* Experience Results */}
      {filteredExperiences.length > 0 && (
        <section>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-cyan-500 text-sm font-bold text-white">
              {filteredExperiences.length}
            </span>
            Experience
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExperiences.map((result) => (
              <SearchResultCard key={result.id} result={result} gradientIndex={cardIndex++} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
