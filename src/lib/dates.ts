// All calendar math happens in America/New_York through Intl, never the host zone.
// A "day key" is an Eastern calendar date written YYYY-MM-DD.
import type { Assignment } from '../types.ts'

export const TIME_ZONE = 'America/New_York'
export const DAY_MS = 86_400_000

export type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const pad = (n: number) => String(n).padStart(2, '0')

export function zonedParts(date: Date): ZonedParts {
  const out: ZonedParts = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 }
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type in out) out[part.type as keyof ZonedParts] = Number(part.value)
  }
  if (out.hour === 24) out.hour = 0
  return out
}

function keyOf(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${pad(month)}-${pad(day)}`
}

function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number)
  return { y, m, d }
}

/** Eastern calendar date of an instant. */
export function dayKey(date: Date): string {
  const p = zonedParts(date)
  return keyOf(p.year, p.month, p.day)
}

/** Eastern wall clock minus UTC at this instant, in ms (e.g. −5 h in winter). */
function offsetMs(instant: number): number {
  const p = zonedParts(new Date(instant))
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return wall - Math.floor(instant / 1000) * 1000
}

/** The instant of midnight Eastern at the start of a day key. */
export function startOfDay(key: string): Date {
  const { y, m, d } = parseKey(key)
  const wallMidnight = Date.UTC(y, m - 1, d)
  const first = wallMidnight - offsetMs(wallMidnight)
  return new Date(wallMidnight - offsetMs(first))
}

export function addDays(key: string, days: number): string {
  const { y, m, d } = parseKey(key)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return keyOf(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  const { y, m, d } = parseKey(key)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const a = parseKey(from)
  const b = parseKey(to)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY_MS)
}

/** "8:30 AM", built from parts so no engine-specific spacing leaks in. */
export function formatClock(date: Date): string {
  const { hour, minute } = zonedParts(date)
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`
}

/** "Tue, Nov 3" */
export function formatShortDate(key: string): string {
  const { m, d } = parseKey(key)
  return `${WEEKDAY_SHORT[weekdayOf(key)]}, ${MONTH_SHORT[m - 1]} ${d}`
}

/** "Nov 3" */
export function formatMonthDay(key: string): string {
  const { m, d } = parseKey(key)
  return `${MONTH_SHORT[m - 1]} ${d}`
}

/** "Tuesday, November 3" */
export function formatLongDate(key: string): string {
  const { m, d } = parseKey(key)
  return `${WEEKDAY_LONG[weekdayOf(key)]}, ${MONTH_LONG[m - 1]} ${d}`
}

type Due = Pick<Assignment, 'due_at' | 'due_precision'>

/** The contract's due moment: "Tue, Nov 3 · 8:30 AM", date-only "Tue, Nov 3", approx adds "(approx.)". */
export function formatDue({ due_at, due_precision }: Due): string {
  const at = new Date(due_at)
  const date = formatShortDate(dayKey(at))
  if (due_precision === 'date') return date
  const moment = `${date} · ${formatClock(at)}`
  return due_precision === 'approx' ? `${moment} (approx.)` : moment
}

/** The row's time column: "8:30 AM", or "" for date-only items. */
export function formatDueClock({ due_at, due_precision }: Due): string {
  return due_precision === 'date' ? '' : formatClock(new Date(due_at))
}

/** Day group heading: "Today · Monday, November 2", "Wednesday, November 4". */
export function formatDayHeading(key: string, todayKey: string): string {
  const offset = daysBetween(todayKey, key)
  const prefix =
    offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : offset === -1 ? 'Yesterday' : ''
  const long = formatLongDate(key)
  return prefix ? `${prefix} · ${long}` : long
}

/** "Due today", "Due tomorrow", "Due in 5 days", "Due 2 days ago". */
export function formatRelativeDue(key: string, todayKey: string): string {
  const offset = daysBetween(todayKey, key)
  if (offset === 0) return 'Due today'
  if (offset === 1) return 'Due tomorrow'
  if (offset === -1) return 'Due yesterday'
  return offset > 0 ? `Due in ${offset} days` : `Due ${-offset} days ago`
}
