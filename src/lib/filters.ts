// Pure list logic: windows, composition of filters, sorting, day grouping.
import { COURSES, type Assignment, type CourseId, type Kind, type Progress } from '../types.ts'
import { addDays, dayKey, startOfDay, weekdayOf } from './dates.ts'

export const WINDOWS = ['all', 'today', 'week', 'fortnight', 'past'] as const
export type WindowKey = (typeof WINDOWS)[number]

export const WINDOW_LABEL: Record<WindowKey, string> = {
  all: 'All',
  today: 'Today',
  week: 'This week',
  fortnight: 'Next two weeks',
  past: 'Past due',
}

export type KindFilter = Kind | 'all'

export type FilterState = {
  courses: Record<CourseId, boolean>
  window: WindowKey
  kind: KindFilter
  hideDone: boolean
}

export const DEFAULT_FILTERS: FilterState = {
  courses: { customer: true, competitor: true, investor: true, state_society: true },
  window: 'all',
  kind: 'all',
  hideDone: true,
}

export function isDefaultFilters(f: FilterState): boolean {
  return (
    COURSES.every((c) => f.courses[c]) &&
    f.window === DEFAULT_FILTERS.window &&
    f.kind === DEFAULT_FILTERS.kind &&
    f.hideDone === DEFAULT_FILTERS.hideDone
  )
}

/** Half-open [from, to) in epoch ms, or null when the window has no bounds. */
export function windowRange(window: WindowKey, now: Date): { from: number; to: number } | null {
  const today = dayKey(now)
  const from = startOfDay(today).getTime()
  switch (window) {
    case 'all':
      return null
    case 'past':
      return { from: -Infinity, to: now.getTime() }
    case 'today':
      return { from, to: startOfDay(addDays(today, 1)).getTime() }
    case 'week': {
      const toSunday = (7 - weekdayOf(today)) % 7
      return { from, to: startOfDay(addDays(today, toSunday + 1)).getTime() }
    }
    case 'fortnight':
      return { from, to: startOfDay(addDays(today, 15)).getTime() }
  }
}

export const isDone = (progress: Progress, id: string): boolean => progress[id]?.done === true

export function isOverdue(a: Assignment, progress: Progress, now: Date): boolean {
  return Date.parse(a.due_at) < now.getTime() && !isDone(progress, a.id)
}

export function sortAssignments(items: readonly Assignment[]): Assignment[] {
  return [...items].sort(
    (a, b) => Date.parse(a.due_at) - Date.parse(b.due_at) || a.title.localeCompare(b.title),
  )
}

/** Course ∧ window ∧ kind ∧ hide-done, sorted by due moment then title. */
export function applyFilters(
  items: readonly Assignment[],
  f: FilterState,
  progress: Progress,
  now: Date,
): Assignment[] {
  const range = windowRange(f.window, now)
  return sortAssignments(
    items.filter((a) => {
      if (!f.courses[a.course]) return false
      if (f.kind !== 'all' && a.kind !== f.kind) return false
      if (f.hideDone && isDone(progress, a.id)) return false
      if (range) {
        const t = Date.parse(a.due_at)
        if (t < range.from || t >= range.to) return false
      }
      return true
    }),
  )
}

export type DayGroup = { key: string; items: Assignment[] }

/** Consecutive runs of an already-sorted list that share an Eastern calendar date. */
export function groupByDay(sorted: readonly Assignment[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const a of sorted) {
    const key = dayKey(new Date(a.due_at))
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(a)
    else groups.push({ key, items: [a] })
  }
  return groups
}
