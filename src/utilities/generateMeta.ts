import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getCanonicalURL } from './getURL'

const SITE_NAME = 'Ronald Allan Rivera'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getCanonicalURL()

  let url = serverUrl + '/og-default.png'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

/**
 * Drives metadata for every CMS Page and Post. It previously appended
 * "| Payload Website Template" to every title and fell back to the starter
 * template's OG image.
 */
export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  /**
   * URL prefix for the document's collection — '/posts' for Posts, '' for
   * top-level Pages. Used to build the canonical path, since the doc itself
   * only carries a bare slug.
   */
  pathPrefix?: string
}): Promise<Metadata> => {
  const { doc, pathPrefix = '' } = args

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title ? `${doc.meta.title} | ${SITE_NAME}` : SITE_NAME

  const slugPath = Array.isArray(doc?.slug) ? doc?.slug.join('/') : doc?.slug

  // 'home' renders at the site root, not /home — without this both URLs would
  // claim to be canonical for the same content.
  const pathname = !slugPath || slugPath === 'home' ? '/' : `${pathPrefix}/${slugPath}`

  return {
    description: doc?.meta?.description,
    // Relative — resolves against metadataBase (the canonical www origin) set
    // in the root layout.
    alternates: { canonical: pathname },
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage ? [{ url: ogImage }] : undefined,
      title,
      url: pathname,
    }),
    title,
  }
}
