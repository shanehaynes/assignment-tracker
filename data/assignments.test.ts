import { describe, expect, it } from 'vitest'
import assignments from './assignments.json'
import semester from './semester.json'
import { COURSES, KINDS, SOURCE_TYPES, type Assignment } from '../src/types.ts'

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-0[45]:00$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

describe('data/assignments.json', () => {
  const items = assignments as Assignment[]

  it('is a non-empty array of well-formed items', () => {
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    for (const a of items) {
      expect(a.id, 'id').toMatch(SLUG)
      expect(COURSES, `course of ${a.id}`).toContain(a.course)
      expect(KINDS, `kind of ${a.id}`).toContain(a.kind)
      expect(['individual', 'group'], `work of ${a.id}`).toContain(a.work)
      expect(a.title.trim().length, `title of ${a.id}`).toBeGreaterThan(0)
      expect(a.due_at, `due_at of ${a.id}`).toMatch(ISO_WITH_OFFSET)
      expect(Number.isNaN(Date.parse(a.due_at)), `due_at parses for ${a.id}`).toBe(false)
      expect(['datetime', 'date', 'approx'], `precision of ${a.id}`).toContain(a.due_precision)
      expect(['silver', 'all'], `cohort of ${a.id}`).toContain(a.cohort_scope)
      expect(a.sources.length, `sources of ${a.id}`).toBeGreaterThan(0)
      for (const s of a.sources) {
        expect(SOURCE_TYPES, `source type in ${a.id}`).toContain(s.type)
        expect(s.ref.trim().length, `source ref in ${a.id}`).toBeGreaterThan(0)
      }
      if (a.canvas_url)
        expect(a.canvas_url, `canvas_url of ${a.id}`).toMatch(/^https:\/\/yale\.instructure\.com\//)
      if (a.canvas_assignment_id) {
        expect(a.canvas_url, `canvas_url names the assignment for ${a.id}`).toContain(
          `/assignments/${a.canvas_assignment_id}`,
        )
      }
      if (a.points != null) expect(a.points).toBeGreaterThanOrEqual(0)
    }
  })

  it('has unique ids and unique Canvas assignment ids', () => {
    const ids = items.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    const canvasIds = items.map((a) => a.canvas_assignment_id).filter((x) => x != null)
    expect(new Set(canvasIds).size).toBe(canvasIds.length)
  })

  it('keeps every due moment inside the semester window', () => {
    const start = Date.parse(`${semester.start}T00:00:00-04:00`)
    const end = Date.parse(`${semester.end}T23:59:59-05:00`)
    for (const a of items) {
      const t = Date.parse(a.due_at)
      expect(t >= start && t <= end, `${a.id} due ${a.due_at} is inside the term`).toBe(true)
    }
  })
})
