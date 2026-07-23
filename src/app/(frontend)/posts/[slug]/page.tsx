import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import Link from 'next/link'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { getTemplate } from '@/utilities/getTemplate'
import { JsonLd } from '@/components/JsonLd'
import { generateBlogPostingSchema, generateBreadcrumbSchema } from '@/utilities/jsonLd'
import { canonicalPath } from '@/utilities/getURL'

// Force dynamic to prevent database queries during build
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const { Layout } = await getTemplate()

  return (
    <Layout>
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <JsonLd data={generateBlogPostingSchema(post)} />
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: canonicalPath('/') },
          { name: 'Blog', url: canonicalPath('/posts') },
          { name: post.title, url: canonicalPath(`/posts/${post.slug}`) },
        ])}
      />

      <article className="px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-10 lg:pb-28">
        <div className="mx-auto w-full max-w-[52rem]">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
          >
            ← Back to blog
          </Link>

          <PostHero post={post} />

          <RichText
            className="prose prose-invert mt-10 max-w-none prose-headings:tracking-[-0.02em] prose-a:text-cyan-300 hover:prose-a:text-cyan-200"
            data={post.content}
            enableGutter={false}
          />

          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-16"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}

          {/* Route readers somewhere useful instead of ending on a dead stop —
              this is also the internal link the SEO plan wants pointing at the
              conversion page. */}
          <div className="mt-16 rounded-[1.9rem] border border-white/10 bg-card-bg p-8 shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
              Working on something similar?
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              I take on full-stack builds, WordPress work, and AI automation — from a scoped
              consultation through to shipped production systems.
            </p>
            <Link
              href="/services"
              className="mt-6 inline-flex items-center rounded-2xl bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 px-6 py-3 text-sm font-extrabold text-[#111111] transition hover:-translate-y-0.5"
            >
              SEE SERVICES
            </Link>
          </div>
        </div>
      </article>
    </Layout>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post, pathPrefix: '/posts' })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
