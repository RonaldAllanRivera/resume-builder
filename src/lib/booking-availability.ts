/**
 * Shared lead-time / availability-window resolution used by both
 * `GET /api/availability/slots` (which hides dates that fail the check) and
 * `POST /api/bookings` (which must reject them outright — see spec section
 * "2. Shared lead-time resolution"). Keeping this logic in one place means
 * the two endpoints cannot drift out of sync.
 */

/**
 * A package that may or may not carry a per-package advance-notice override.
 *
 * `Packages.advanceNoticeDays` does not exist yet as a schema field (a later
 * task adds it) — this type is intentionally loose so callers can pass today's
 * `Package` (which lacks the field) or tomorrow's `Package` (which has it).
 */
export interface PackageWithOptionalAdvanceNotice {
  advanceNoticeDays?: number | null
}

/**
 * The subset of `AvailabilityRule` this module reads from. Declared loosely
 * (rather than `Pick<AvailabilityRule, ...>`) so the helpers stay testable
 * with plain fixtures — a real `AvailabilityRule`'s required numeric fields
 * satisfy this structurally.
 */
export interface RuleWithOptionalWindowFields {
  advanceNoticeDays?: number | null
  maxAdvanceDays?: number | null
}

/**
 * Finds the availability rule whose `daysOfWeek` includes the requested
 * date's ISO day of week (Mon=1 .. Sun=7). Returns `null` if none match.
 */
export function findMatchingRule<
  R extends { daysOfWeek?: unknown },
>(rules: R[], date: Date): R | null {
  const isoDayOfWeek = date.getDay() === 0 ? 7 : date.getDay()

  const match = rules.find((rule) => {
    const daysOfWeek = (rule.daysOfWeek as string[]) || []
    return daysOfWeek.includes(String(isoDayOfWeek))
  })

  return match ?? null
}

/**
 * Resolves the effective advance-notice requirement: a package-level override
 * wins, then the availability rule's value, then a hardcoded default of 7.
 */
export function resolveAdvanceNoticeDays(
  pkg: PackageWithOptionalAdvanceNotice | null | undefined,
  rule: RuleWithOptionalWindowFields | null | undefined,
): number {
  return pkg?.advanceNoticeDays ?? rule?.advanceNoticeDays ?? 7
}

export interface BookingWindowParams {
  /** The requested booking start (or the requested calendar date at 00:00). */
  startAt: Date
  pkg: PackageWithOptionalAdvanceNotice | null | undefined
  rule: RuleWithOptionalWindowFields
  /** Defaults to `new Date()` — injectable for tests. */
  now?: Date
}

export interface BookingWindowResult {
  ok: boolean
  reason?: string
  minDate: Date
  maxDate: Date
}

/**
 * Computes whether `startAt` falls within the bookable window: no earlier
 * than the resolved advance-notice requirement, no later than the rule's
 * `maxAdvanceDays`. Mirrors the min/max computation the slots endpoint used
 * inline before this extraction.
 */
export function isWithinBookingWindow({
  startAt,
  pkg,
  rule,
  now = new Date(),
}: BookingWindowParams): BookingWindowResult {
  const advanceNoticeDays = resolveAdvanceNoticeDays(pkg, rule)
  const maxAdvanceDays = rule.maxAdvanceDays ?? 60

  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() + advanceNoticeDays)
  minDate.setHours(0, 0, 0, 0)

  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
  maxDate.setHours(23, 59, 59, 999)

  if (startAt < minDate) {
    return {
      ok: false,
      reason: `Bookings require at least ${advanceNoticeDays} days advance notice`,
      minDate,
      maxDate,
    }
  }

  if (startAt > maxDate) {
    return {
      ok: false,
      reason: `Bookings can only be made up to ${maxAdvanceDays} days in advance`,
      minDate,
      maxDate,
    }
  }

  return { ok: true, minDate, maxDate }
}
