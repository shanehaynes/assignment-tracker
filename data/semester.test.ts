import { describe, expect, it } from 'vitest'
import semester from './semester.json'
import type { Semester } from '../src/types.ts'

describe('data/semester.json', () => {
  const s = semester as Semester
  it('has an ordered window that contains today', () => {
    expect(s.start < s.end).toBe(true)
    expect(s.cohort).toBe('silver')
    expect(s.timezone).toBe('America/New_York')
  })
  it('keeps milestones inside the window and in order', () => {
    const dates = s.milestones.map((m) => m.date)
    expect([...dates].sort()).toEqual(dates)
    for (const m of s.milestones) {
      expect(m.date >= s.start && m.date <= s.end).toBe(true)
      if (m.end) expect(m.end >= m.date).toBe(true)
    }
  })
})
