import { describe, it, expect } from 'vitest'

import {
  findMatchingRule,
  resolveAdvanceNoticeDays,
  isWithinBookingWindow,
} from '@/lib/booking-availability'

// Pure-function unit tests — no DB needed. Kept under the `.int.spec.ts`
// suffix so the existing vitest `include` glob (`tests/int/**/*.int.spec.ts`)
// picks them up alongside the DB-backed integration tests.

interface FakeRule {
  daysOfWeek: string[]
  advanceNoticeDays?: number
  maxAdvanceDays?: number
}

function makeRule(overrides: Partial<FakeRule> = {}): FakeRule {
  return {
    daysOfWeek: ['1', '2', '3', '4', '5'],
    advanceNoticeDays: 7,
    maxAdvanceDays: 60,
    ...overrides,
  }
}

describe('findMatchingRule', () => {
  it('matches a weekday rule against a Monday date', () => {
    const rule = makeRule({ daysOfWeek: ['1'] })
    // 2026-07-27 is a Monday
    const monday = new Date('2026-07-27T00:00:00')

    expect(findMatchingRule([rule], monday)).toBe(rule)
  })

  it('matches Sunday to daysOfWeek "7" (ISO Mon=1..Sun=7 edge case)', () => {
    const rule = makeRule({ daysOfWeek: ['7'] })
    // 2026-07-26 is a Sunday; JS Date#getDay() returns 0 for Sunday, which
    // must be mapped to ISO day 7, not left as "0".
    const sunday = new Date('2026-07-26T00:00:00')

    expect(findMatchingRule([rule], sunday)).toBe(rule)
  })

  it('does not match a rule lacking the requested day', () => {
    const rule = makeRule({ daysOfWeek: ['6'] }) // Saturday only
    const monday = new Date('2026-07-27T00:00:00')

    expect(findMatchingRule([rule], monday)).toBeNull()
  })

  it('returns null when no rules are given', () => {
    const monday = new Date('2026-07-27T00:00:00')

    expect(findMatchingRule([], monday)).toBeNull()
  })

  it('picks the first rule that matches when multiple are present', () => {
    const noMatch = makeRule({ daysOfWeek: ['6'] })
    const match = makeRule({ daysOfWeek: ['1'] })
    const monday = new Date('2026-07-27T00:00:00')

    expect(findMatchingRule([noMatch, match], monday)).toBe(match)
  })
})

describe('resolveAdvanceNoticeDays', () => {
  it('prefers the package override over the rule value', () => {
    const pkg = { advanceNoticeDays: 2 }
    const rule = { advanceNoticeDays: 7 }

    expect(resolveAdvanceNoticeDays(pkg, rule)).toBe(2)
  })

  it('falls back to the rule value when the package has no override', () => {
    const pkg = { advanceNoticeDays: null }
    const rule = { advanceNoticeDays: 7 }

    expect(resolveAdvanceNoticeDays(pkg, rule)).toBe(7)
  })

  it('falls back to the rule value when the package is undefined', () => {
    const rule = { advanceNoticeDays: 10 }

    expect(resolveAdvanceNoticeDays(undefined, rule)).toBe(10)
  })

  it('defaults to 7 when neither package nor rule specify a value', () => {
    expect(resolveAdvanceNoticeDays(undefined, undefined)).toBe(7)
    expect(resolveAdvanceNoticeDays({}, {})).toBe(7)
    expect(resolveAdvanceNoticeDays({ advanceNoticeDays: null }, { advanceNoticeDays: null })).toBe(
      7,
    )
  })
})

describe('isWithinBookingWindow', () => {
  const now = new Date('2026-07-21T12:00:00Z')

  it('rejects a date inside the advance-notice window (too soon)', () => {
    const rule = makeRule({ advanceNoticeDays: 7, maxAdvanceDays: 60 })
    // Only 1 day out, but 7 days' notice is required.
    const tooSoon = new Date('2026-07-22T10:00:00Z')

    const result = isWithinBookingWindow({ startAt: tooSoon, pkg: undefined, rule, now })

    expect(result.ok).toBe(false)
    expect(result.reason).toBe('Bookings require at least 7 days advance notice')
  })

  it('accepts a date outside the advance-notice window (far enough out)', () => {
    const rule = makeRule({ advanceNoticeDays: 7, maxAdvanceDays: 60 })
    // 14 days out clears the 7-day requirement.
    const farEnough = new Date('2026-08-04T10:00:00Z')

    const result = isWithinBookingWindow({ startAt: farEnough, pkg: undefined, rule, now })

    expect(result.ok).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('rejects a date beyond maxAdvanceDays', () => {
    const rule = makeRule({ advanceNoticeDays: 7, maxAdvanceDays: 60 })
    // 90 days out exceeds the 60-day cap.
    const tooFar = new Date('2026-10-19T10:00:00Z')

    const result = isWithinBookingWindow({ startAt: tooFar, pkg: undefined, rule, now })

    expect(result.ok).toBe(false)
    expect(result.reason).toBe('Bookings can only be made up to 60 days in advance')
  })

  it('honours a package-level advanceNoticeDays override over the rule', () => {
    const rule = makeRule({ advanceNoticeDays: 7, maxAdvanceDays: 60 })
    const pkg = { advanceNoticeDays: 2 }
    // 3 days out: fails the rule's 7-day default, passes the package's 2-day override.
    const threeDaysOut = new Date('2026-07-24T10:00:00Z')

    const result = isWithinBookingWindow({ startAt: threeDaysOut, pkg, rule, now })

    expect(result.ok).toBe(true)
  })

  it('computes minDate at local midnight and maxDate at local end-of-day', () => {
    const rule = makeRule({ advanceNoticeDays: 5, maxAdvanceDays: 30 })

    const result = isWithinBookingWindow({
      startAt: new Date('2026-07-26T10:00:00Z'),
      pkg: undefined,
      rule,
      now,
    })

    const expectedMinDate = new Date(now)
    expectedMinDate.setDate(expectedMinDate.getDate() + 5)
    expectedMinDate.setHours(0, 0, 0, 0)

    const expectedMaxDate = new Date(now)
    expectedMaxDate.setDate(expectedMaxDate.getDate() + 30)
    expectedMaxDate.setHours(23, 59, 59, 999)

    expect(result.minDate).toEqual(expectedMinDate)
    expect(result.maxDate).toEqual(expectedMaxDate)
  })
})
