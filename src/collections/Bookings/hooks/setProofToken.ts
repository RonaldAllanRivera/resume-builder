import { randomBytes } from 'crypto'
import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Generates an unguessable, per-booking token used to authorize the
 * unauthenticated payment-proof upload flow (`/api/bookings/proof`,
 * `/book/proof/[token]`).
 *
 * SECURITY: this token — NOT the sequential `bookings.id` — is what proves a
 * caller is allowed to upload proof for a given booking. It must never be
 * derived from the id or any other guessable/enumerable value. 24 random
 * bytes (192 bits) base64url-encoded gives a search space no realistic
 * attacker can enumerate or brute-force.
 *
 * Only runs on create, and only if a token isn't already set, so re-saving an
 * existing booking (status changes, admin edits) never rotates the token out
 * from under an in-flight email link.
 */
export const setProofToken: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create' && !data.proofToken) {
    data.proofToken = randomBytes(24).toString('base64url')
  }
  return data
}
