import Link from 'next/link'
import type { SearchResult } from '@/utilities/search'

interface SearchResultCardProps {
  result: SearchResult
  gradientIndex: number
}

const gradients = [
  'from-cyan-400 via-blue-500 to-indigo-600',
  'from-rose-400 via-pink-500 to-orange-500',
  'from-amber-400 via-yellow-500 to-lime-500',
  'from-emerald-400 via-green-500 to-teal-500',
  'from-purple-400 via-violet-500 to-fuchsia-500',
  'from-sky-400 via-cyan-500 to-blue-500',
  'from-pink-400 via-rose-500 to-red-500',
  'from-indigo-400 via-purple-500 to-pink-500',
  'from-lime-400 via-green-500 to-emerald-500',
  'from-orange-400 via-amber-500 to-yellow-500',
  'from-teal-400 via-cyan-500 to-sky-500',
]

export function SearchResultCard({ result, gradientIndex }: SearchResultCardProps) {
  const gradient = gradients[gradientIndex % gradients.length]

  const getCategoryLabel = () => {
    if (result.type === 'experience') return 'EXPERIENCE'
    if (result.type === 'project') return 'PROJECT'
    if (result.type === 'certification') return 'CERTIFICATION'
    return ''
  }

  const getLink = () => {
    if (result.type === 'experience') return '/#experience'
    if (result.type === 'project') return '/projects'
    if (result.type === 'certification') return '/certifications'
    return '#'
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1b23] to-[#0f1015] shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      {/* Gradient Header */}
      <div className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {/* Category Badge */}
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {getCategoryLabel()}
          </span>
        </div>

        {/* Glass Morphism Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white line-clamp-1">{result.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Subtitle */}
        <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
          <span>{result.subtitle}</span>
          {result.date && (
            <>
              <span>•</span>
              <span>{result.date}</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-white/70">
          {result.description}
        </p>

        {/* Tags */}
        {result.tags && result.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {result.tags.slice(0, 5).map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={getLink()}
            className={`flex-1 rounded-xl bg-gradient-to-r ${gradient} px-4 py-2.5 text-center text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20`}
          >
            View Details
          </Link>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Relevance Score (for debugging - can be removed) */}
        {result.relevanceScore > 0 && (
          <div className="mt-3 text-xs text-white/40">
            Relevance: {result.relevanceScore}
          </div>
        )}
      </div>
    </div>
  )
}
