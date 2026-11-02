import { describe, expect, it } from 'vitest'
import type { Assignment } from '../types.ts'
import { setDone, termFraction, termPercent, workCounts } from './progress.ts'

const TERM = { start: '2026-10-26', end: '2027-03-08' }

describe('term position', () => {
  it('floors the share of the term elapsed between Eastern midnights', () => {
    // 181 h into a 3,193 h term (the term spans the November DST change).
    expect(termPercent(new Date('2026-11-02T17:00:00Z'), TERM)).toBe(5)
    expect(termPercent(new Date('2026-10-26T04:00:00Z'), TERM)).toBe(0)
    expect(termPercent(new Date('2027-03-08T04:59:59Z'), TERM)).toBe(99)
  })

  it('clamps before the start and after the end', () => {
    expect(termPercent(new Date('2026-10-01T12:00:00Z'), TERM)).toBe(0)
    expect(termPercent(new Date('2027-05-01T12:00:00Z'), TERM)).toBe(100)
    expect(termFraction(Date.parse('2027-05-01T12:00:00Z'), TERM)).toBe(1)
  })
})

describe('work', () => {
  const a = (id: string) => ({ id }) as Assignment

  it('counts done items among current assignments only', () => {
    const progress = {
      x: { done: true as const, at: '' },
      stale: { done: true as const, at: '' },
    }
    expect(workCounts([a('x'), a('y')], progress)).toEqual({ done: 1, total: 2 })
  })

  it('sets and clears without mutating', () => {
    const before = {}
    const at = new Date('2026-11-02T17:00:00Z')
    const after = setDone(before, 'x', true, at)
    expect(before).toEqual({})
    expect(after).toEqual({ x: { done: true, at: '2026-11-02T17:00:00.000Z' } })
    expect(setDone(after, 'x', false, at)).toEqual({})
  })
})
