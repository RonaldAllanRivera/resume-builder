'use client'

import React from 'react'
import Link from 'next/link'
import type { Post, SiteSetting } from '@/payload-types'
import { HeroReveal } from './components/HeroReveal'
import { ScrollReveal } from './components/ScrollReveal'
import { CTAButtons } from './components/CTAButtons'

/**
 * The listing query uses `select`, so it returns a projection rather than a
 * full Post. Typing to exactly the fields this component reads keeps the
 * contract honest instead of casting a partial to Post.
 */
export type BlogPostSummary = Pick<Post, 'id' | 'title'> &
  Partial<Pick<Post, 'slug' | 'categories' | 'meta' | 'publishedAt'>>

interface BlogPageProps {
  posts?: BlogPostSummary[]
  /** Accepted for parity with the other template pages; unused here today. */
  settings?: SiteSetting | null
  /** Total published posts, for the count pill. Defaults to posts.length. */
  totalDocs?: number
}

// Same rotating spectrum the certifications grid uses, so a post card reads as
// part of the same family rather than a bolt-on.
const gradients = [
  'from-emerald-400 via-cyan-400 to-blue-500',
  'from-rose-400 via-orange-300 to-amber-300',
  'from-sky-400 via-indigo-300 to-violet-400',
  'from-fuchsia-400 via-pink-300 to-rose-300',
  'from-orange-400 via-yellow-300 to-lime-300',
  'from-violet-400 via-purple-300 to-indigo-400',
]

function formatDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function categoryNames(post: BlogPostSummary): string[] {
  if (!Array.isArray(post.categories)) return []
  return post.categories
    .map((c) => (typeof c === 'object' && c !== null ? c.title : null))
    .filter((t): t is string => Boolean(t))
}

function PostCard({ post, gradient }: { post: BlogPostSummary; gradient: string }) {
  const href = `/posts/${post.slug}`
  const cats = categoryNames(post)
  const published = formatDate(post.publishedAt)
  const description = post.meta?.description

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.9rem] border border-white/10 bg-card-bg shadow-[0_18px_50px_rgba(0,0,0,0.32)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <div className="flex h-full flex-col p-6 sm:p-7">
        {cats.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {cats.map((name) => (
              <span
                key={name}
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/70"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold leading-snug tracking-[-0.02em] text-white sm:text-2xl">
          <Link href={href} className="transition hover:text-white/80">
            {/* Stretched link: the whole card is clickable, but the accessible
                name still comes from the heading text. */}
            <span className="absolute inset-0" aria-hidden="true" />
            {post.title}
          </Link>
        </h2>

        {description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/65">{description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-6">
          {published ? (
            <time dateTime={post.publishedAt ?? undefined} className="text-xs text-white/45">
              {published}
            </time>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold text-white/70 transition group-hover:text-white">
            Read →
          </span>
        </div>
      </div>
    </article>
  )
}

/**
 * The empty state is deliberately not a "no posts found" dead end. With zero
 * published posts this is the whole page, and a visitor who lands here from
 * search or a nav click is a warm lead — so it says something honest and routes
 * them to the pages that can actually convert.
 */
function EmptyState() {
  return (
    <div className="rounded-[1.9rem] border border-white/10 bg-card-bg p-8 shadow-[0_18px_50px_rgba(0,0,0,0.32)] sm:p-12">
      <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />

      <h2 className="mt-8 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">
        Writing in progress
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
        I&apos;m putting together write-ups on the systems I&apos;ve actually shipped — migrating a
        Laravel monolith onto AWS microservices, building a child-safe AI companion, and the
        architecture calls behind them. They&apos;ll land here as they&apos;re finished.
      </p>

      <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
        In the meantime, the work itself is the better read.
      </p>

      <CTAButtons />
    </div>
  )
}

export function BlogPage({ posts = [], totalDocs }: BlogPageProps) {
  const count = totalDocs ?? posts.length
  const hasPosts = posts.length > 0

  return (
    <>
      <section className="hero-bg relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pb-20">
        <HeroReveal className="mx-auto w-full max-w-[1700px]">
          <span className="inline-flex rounded-full border border-white/10 bg-[#191a21]/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 backdrop-blur">
            {hasPosts ? `${count} ${count === 1 ? 'article' : 'articles'}` : 'Blog'}
          </span>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl xl:text-7xl">
            Notes from building things that ship
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/78">
            Practical write-ups on full-stack engineering — Laravel and Python backends, React and
            Next.js frontends, WordPress at scale, AI automation, and the architecture decisions
            behind real production systems.
          </p>
        </HeroReveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-[1700px]">
          {hasPosts ? (
            <ScrollReveal>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    gradient={gradients[index % gradients.length]}
                  />
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal>
              <EmptyState />
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  )
}
