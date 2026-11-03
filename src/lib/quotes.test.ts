import { describe, expect, it } from 'vitest'
import type { Quote } from '../types.ts'
import { dayIndex, quoteForDate } from './quotes.ts'

const q = (i: number): Quote => ({
  text: `Line ${i}`,
  author: `Author ${i}`,
  work: `Work ${i}`,
  source_url: `https://example.com/${i}`,
})
const BANK = [q(0), q(1), q(2)]
const SEMESTER = { start: '2026-10-26' }

describe('dayIndex', () => {
  it('is 0 on the start date, from midnight to the last second', () => {
    expect(dayIndex('2026-10-26', new Date('2026-10-26T00:00:00-04:00'))).toBe(0)
    expect(dayIndex('2026-10-26', new Date('2026-10-26T23:59:59-04:00'))).toBe(0)
  })

  it('counts whole Eastern days after the start', () => {
    expect(dayIndex('2026-10-26', new Date('2026-11-04T09:00:00-05:00'))).toBe(9)
  })

  it('is negative before the start', () => {
    expect(dayIndex('2026-10-26', new Date('2026-10-25T23:59:59-04:00'))).toBe(-1)
    expect(dayIndex('2026-10-26', new Date('2026-10-20T12:00:00-04:00'))).toBe(-6)
  })

  it('uses the Eastern date, not the UTC date', () => {
    // 02:00 UTC on Oct 27 is still 10 PM Oct 26 in New York.
    expect(dayIndex('2026-10-26', new Date('2026-10-27T02:00:00Z'))).toBe(0)
  })
})

describe('quoteForDate', () => {
  it('returns null for an empty bank', () => {
    expect(quoteForDate([], SEMESTER, new Date('2026-11-04T09:00:00-05:00'))).toBeNull()
  })

  it('always returns the only quote when n = 1', () => {
    for (const at of [
      '2026-10-01T12:00:00-04:00',
      '2026-10-26T00:00:00-04:00',
      '2027-02-14T12:00:00-05:00',
    ])
      expect(quoteForDate([q(7)], SEMESTER, new Date(at))).toEqual(q(7))
  })

  it('shows the first quote on the start date', () => {
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-26T08:00:00-04:00'))).toBe(BANK[0])
  })

  it('advances one quote per day', () => {
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-27T08:00:00-04:00'))).toBe(BANK[1])
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-28T08:00:00-04:00'))).toBe(BANK[2])
  })

  it('wraps past the end of the bank', () => {
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-29T08:00:00-04:00'))).toBe(BANK[0])
    // Nov 4 is day 9: 9 mod 3 = 0. Nov 5 is day 10: 10 mod 3 = 1.
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-11-04T08:00:00-05:00'))).toBe(BANK[0])
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-11-05T08:00:00-05:00'))).toBe(BANK[1])
  })

  it('wraps negative days before the start onto the end of the bank', () => {
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-25T08:00:00-04:00'))).toBe(BANK[2])
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-24T08:00:00-04:00'))).toBe(BANK[1])
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-23T08:00:00-04:00'))).toBe(BANK[0])
    expect(quoteForDate(BANK, SEMESTER, new Date('2026-10-22T08:00:00-04:00'))).toBe(BANK[2])
  })

  describe('switches at midnight Eastern', () => {
    const cases: [string, string, string, number, number][] = [
      // label, one second before midnight, midnight, day index before, after
      ['in EDT', '2026-10-27T23:59:59-04:00', '2026-10-28T00:00:00-04:00', 1, 2],
      [
        'into the DST change (Nov 1)',
        '2026-10-31T23:59:59-04:00',
        '2026-11-01T00:00:00-04:00',
        5,
        6,
      ],
      ['out of the DST change day', '2026-11-01T23:59:59-05:00', '2026-11-02T00:00:00-05:00', 6, 7],
      ['in EST (December)', '2026-12-14T23:59:59-05:00', '2026-12-15T00:00:00-05:00', 49, 50],
    ]
    for (const [label, before, at, dBefore, dAfter] of cases) {
      it(label, () => {
        expect(dayIndex(SEMESTER.start, new Date(before))).toBe(dBefore)
        expect(dayIndex(SEMESTER.start, new Date(at))).toBe(dAfter)
        expect(quoteForDate(BANK, SEMESTER, new Date(before))).toBe(BANK[dBefore % 3])
        expect(quoteForDate(BANK, SEMESTER, new Date(at))).toBe(BANK[dAfter % 3])
      })
    }
  })
})
