import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { getTemplate, getSiteSettings } from '@/utilities/getTemplate'
import { Pagination } from '@/components/Pagination'
import { JsonLd } from '@/components/JsonLd'
import { generateBreadcrumbSchema, generateWebPageSchema } from '@/utilities/jsonLd'
import { canonicalPath } from '@/utilities/getURL'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })
  const template = await getTemplate()
  const settings = await getSiteSettings()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      publishedAt: true,
    },
  })

  const { Layout, BlogPage } = template

  return (
    <Layout>
      <JsonLd
        data={generateWebPageSchema(
          'Blog',
          'Practical write-ups on full-stack engineering — Laravel, Python, React and Next.js, WordPress, and AI automation.',
          canonicalPath('/posts'),
        )}
      />
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: canonicalPath('/') },
          { name: 'Blog', url: canonicalPath('/posts') },
        ])}
      />

      {BlogPage && (
        <BlogPage posts={posts.docs} settings={settings} totalDocs={posts.totalDocs} />
      )}

      {posts.totalPages > 1 && posts.page && (
        <div className="px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1700px]">
            <Pagination page={posts.page} totalPages={posts.totalPages} />
          </div>
        </div>
      )}
    </Layout>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Blog | Ronald Allan Rivera',
    description:
      'Notes on full-stack engineering — Laravel, Python, React and Next.js, WordPress, AI automation, and the architecture decisions behind real production systems.',
    alternates: { canonical: '/posts' },
  }
}
