import { describe, expect, it } from 'vitest'
import type { Assignment, Progress } from '../types.ts'
import {
  DEFAULT_FILTERS,
  applyFilters,
  groupByDay,
  isDefaultFilters,
  isOverdue,
  type FilterState,
} from './filters.ts'

const item = (id: string, due_at: string, extra: Partial<Assignment> = {}): Assignment => ({
  id,
  course: 'customer',
  title: id,
  kind: 'homework',
  work: 'individual',
  due_at,
  due_precision: 'datetime',
  sources: [{ type: 'syllabus', ref: 'syllabus' }],
  cohort_scope: 'silver',
  ...extra,
})

// Wednesday, November 4, 2026, noon Eastern.
const NOW = new Date('2026-11-04T17:00:00Z')

const ITEMS: Assignment[] = [
  item('tue-late', '2026-11-03T23:59:00-05:00'),
  item('wed-early', '2026-11-04T00:00:00-05:00'),
  item('wed-morning', '2026-11-04T08:30:00-05:00', { course: 'competitor', kind: 'memo' }),
  item('wed-night', '2026-11-04T23:59:00-05:00', { course: 'investor' }),
  item('sun-late', '2026-11-08T23:59:00-05:00'),
  item('mon-next', '2026-11-09T00:00:00-05:00'),
  item('day-14', '2026-11-18T23:59:00-05:00'),
  item('day-15', '2026-11-19T00:00:00-05:00'),
]

const ids = (f: Partial<FilterState>, progress: Progress = {}, now = NOW) =>
  applyFilters(ITEMS, { ...DEFAULT_FILTERS, ...f }, progress, now).map((a) => a.id)

describe('windows', () => {
  it('all keeps everything, sorted', () => {
    expect(ids({})).toEqual(ITEMS.map((a) => a.id))
  })

  it('today is the Eastern calendar date, including hours already past', () => {
    expect(ids({ window: 'today' })).toEqual(['wed-early', 'wed-morning', 'wed-night'])
  })

  it('this week runs from midnight today through Sunday 23:59', () => {
    expect(ids({ window: 'week' })).toEqual(['wed-early', 'wed-morning', 'wed-night', 'sun-late'])
  })

  it('this week on a Sunday is just that Sunday', () => {
    const sunday = new Date('2026-11-08T15:00:00Z')
    expect(ids({ window: 'week' }, {}, sunday)).toEqual(['sun-late'])
  })

  it('next two weeks runs through today + 14 days at 23:59', () => {
    expect(ids({ window: 'fortnight' })).toEqual([
      'wed-early',
      'wed-morning',
      'wed-night',
      'sun-late',
      'mon-next',
      'day-14',
    ])
  })

  it('past due is anything due before now', () => {
    expect(ids({ window: 'past' })).toEqual(['tue-late', 'wed-early', 'wed-morning'])
  })
})

describe('composition', () => {
  it('ands course, kind, window and hide-done', () => {
    const progress: Progress = { 'wed-early': { done: true, at: '2026-11-04T05:00:00Z' } }
    expect(ids({ window: 'today' }, progress)).toEqual(['wed-morning', 'wed-night'])
    expect(ids({ window: 'today', hideDone: false }, progress)).toEqual([
      'wed-early',
      'wed-morning',
      'wed-night',
    ])
    expect(
      ids({ window: 'today', courses: { ...DEFAULT_FILTERS.courses, investor: false } }),
    ).toEqual(['wed-early', 'wed-morning'])
    expect(ids({ kind: 'memo' })).toEqual(['wed-morning'])
    expect(
      ids({ kind: 'memo', courses: { ...DEFAULT_FILTERS.courses, competitor: false } }),
    ).toEqual([])
  })

  it('knows when filters differ from the defaults', () => {
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true)
    expect(isDefaultFilters({ ...DEFAULT_FILTERS, hideDone: false })).toBe(false)
    expect(
      isDefaultFilters({
        ...DEFAULT_FILTERS,
        courses: { ...DEFAULT_FILTERS.courses, investor: false },
      }),
    ).toBe(false)
  })
})

describe('sorting, grouping, overdue', () => {
  it('breaks due-time ties by title and groups by Eastern date', () => {
    const list = applyFilters(
      [
        item('b', '2026-11-04T23:30:00-05:00', { title: 'Beta' }),
        item('a', '2026-11-04T23:30:00-05:00', { title: 'Alpha' }),
        item('c', '2026-11-05T00:30:00-05:00', { title: 'Gamma' }),
      ],
      DEFAULT_FILTERS,
      {},
      NOW,
    )
    expect(list.map((a) => a.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(groupByDay(list).map((g) => [g.key, g.items.length])).toEqual([
      ['2026-11-04', 2],
      ['2026-11-05', 1],
    ])
  })

  it('flags overdue only when past due and not done', () => {
    const late = ITEMS[0]
    expect(isOverdue(late, {}, NOW)).toBe(true)
    expect(isOverdue(late, { [late.id]: { done: true, at: '' } }, NOW)).toBe(false)
    expect(isOverdue(ITEMS[3], {}, NOW)).toBe(false)
  })
})
