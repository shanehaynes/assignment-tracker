// The progress strip's arithmetic.
import type { Assignment, Progress, Semester } from '../types.ts'
import { startOfDay } from './dates.ts'
import { isDone } from './filters.ts'

/** Midnight Eastern on semester.start and semester.end, in epoch ms. */
export function termBounds(semester: Pick<Semester, 'start' | 'end'>): {
  start: number
  end: number
} {
  return { start: startOfDay(semester.start).getTime(), end: startOfDay(semester.end).getTime() }
}

/** Position of an instant in the term, 0–1, clamped. */
export function termFraction(at: number, semester: Pick<Semester, 'start' | 'end'>): number {
  const { start, end } = termBounds(semester)
  if (end <= start) return at >= end ? 1 : 0
  return Math.min(1, Math.max(0, (at - start) / (end - start)))
}

/** floor((now − start) / (end − start) × 100), clamped to 0–100. */
export function termPercent(now: Date, semester: Pick<Semester, 'start' | 'end'>): number {
  const { start, end } = termBounds(semester)
  if (end <= start) return now.getTime() >= end ? 100 : 0
  const n = Math.floor(((now.getTime() - start) / (end - start)) * 100)
  return Math.min(100, Math.max(0, n))
}

/** Done and total across every assignment, ignoring filters and stale progress ids. */
export function workCounts(
  assignments: readonly Assignment[],
  progress: Progress,
): { done: number; total: number } {
  let done = 0
  for (const a of assignments) if (isDone(progress, a.id)) done++
  return { done, total: assignments.length }
}

/** A new Progress with one id marked done (stamped `at`) or cleared. */
export function setDone(progress: Progress, id: string, done: boolean, at: Date): Progress {
  const next = { ...progress }
  if (done) next[id] = { done: true, at: at.toISOString() }
  else delete next[id]
  return next
}
