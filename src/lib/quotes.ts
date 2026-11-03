// The quote of the day: one entry of the bank per Eastern calendar day, cycling from the term start.
import type { Quote, Semester } from '../types.ts'
import { dayKey, daysBetween } from './dates.ts'

/** Whole days from midnight Eastern on `start` to midnight Eastern on `now`'s date; negative before. */
export function dayIndex(start: string, now: Date): number {
  return daysBetween(start, dayKey(now))
}

/** quotes[((d mod n) + n) mod n], or null when the bank is empty. */
export function quoteForDate(
  quotes: readonly Quote[],
  semester: Pick<Semester, 'start'>,
  now: Date,
): Quote | null {
  const n = quotes.length
  if (n === 0) return null
  const d = dayIndex(semester.start, now)
  return quotes[((d % n) + n) % n]
}
