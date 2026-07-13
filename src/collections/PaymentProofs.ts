import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { anyone } from '../access/anyone'

/**
 * Client-uploaded payment screenshots.
 *
 * Deliberately NOT the `media` collection: `media` is world-readable, and a
 * payment receipt carries the client's name and partial account numbers.
 *
 * `create: anyone` because the client submitting proof is unauthenticated.
 * Reading them back is admin/editor only.
 *
 * NOTE: with vercelBlobStorage the blob itself is served from an unguessable
 * but PUBLIC url — Payload's access control guards the metadata, not the bytes.
 * Purge proofs once a booking settles.
 */
export const PaymentProofs: CollectionConfig = {
  slug: 'paymentProofs',
  admin: {
    group: 'Booking',
    useAsTitle: 'filename',
  },
  access: {
    create: anyone,
    read: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  fields: [],
}
