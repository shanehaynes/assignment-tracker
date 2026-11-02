import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayKey,
  daysBetween,
  formatDayHeading,
  formatDue,
  formatDueClock,
  formatLongDate,
  formatMonthDayRange,
  formatRelativeDue,
  startOfDay,
  weekdayOf,
  zonedParts,
} from './dates.ts'

describe('Eastern-time parts', () => {
  it('reads wall-clock parts in New York regardless of host zone', () => {
    expect(zonedParts(new Date('2026-11-04T03:30:00Z'))).toEqual({
      year: 2026,
      month: 11,
      day: 3,
      hour: 22,
      minute: 30,
      second: 0,
    })
    expect(dayKey(new Date('2026-11-04T03:30:00Z'))).toBe('2026-11-03')
    expect(dayKey(new Date('2026-11-04T05:00:00Z'))).toBe('2026-11-04')
  })

  it('finds midnight Eastern on both sides of daylight-saving changes', () => {
    expect(startOfDay('2026-10-26').toISOString()).toBe('2026-10-26T04:00:00.000Z')
    expect(startOfDay('2026-11-01').toISOString()).toBe('2026-11-01T04:00:00.000Z')
    expect(startOfDay('2026-11-02').toISOString()).toBe('2026-11-02T05:00:00.000Z')
    expect(startOfDay('2027-03-14').toISOString()).toBe('2027-03-14T05:00:00.000Z')
    expect(startOfDay('2027-03-15').toISOString()).toBe('2027-03-15T04:00:00.000Z')
  })

  it('does calendar arithmetic on day keys', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
    expect(weekdayOf('2026-11-02')).toBe(1)
    expect(weekdayOf('2026-11-08')).toBe(0)
    expect(daysBetween('2026-11-02', '2026-11-16')).toBe(14)
    expect(daysBetween('2026-11-02', '2026-10-31')).toBe(-2)
  })
})

describe('formatting', () => {
  it('formats the due moment as the contract shows', () => {
    const due_at = '2026-11-03T08:30:00-05:00'
    expect(formatDue({ due_at, due_precision: 'datetime' })).toBe('Tue, Nov 3 · 8:30 AM')
    expect(formatDue({ due_at, due_precision: 'date' })).toBe('Tue, Nov 3')
    expect(formatDue({ due_at, due_precision: 'approx' })).toBe('Tue, Nov 3 · 8:30 AM (approx.)')
  })

  it('formats clock times without engine-specific spaces', () => {
    const clock = (due_at: string) => formatDueClock({ due_at, due_precision: 'datetime' })
    expect(clock('2026-11-03T23:59:00-05:00')).toBe('11:59 PM')
    expect(clock('2026-11-03T12:00:00-05:00')).toBe('12:00 PM')
    expect(clock('2026-11-03T00:15:00-05:00')).toBe('12:15 AM')
    expect(formatDueClock({ due_at: '2026-11-03T23:59:00-05:00', due_precision: 'date' })).toBe('')
  })

  it('labels day headings and relative due dates', () => {
    expect(formatLongDate('2026-11-03')).toBe('Tuesday, November 3')
    expect(formatDayHeading('2026-11-02', '2026-11-02')).toBe('Today · Monday, November 2')
    expect(formatDayHeading('2026-11-03', '2026-11-02')).toBe('Tomorrow · Tuesday, November 3')
    expect(formatDayHeading('2026-11-01', '2026-11-02')).toBe('Yesterday · Sunday, November 1')
    expect(formatDayHeading('2026-11-10', '2026-11-02')).toBe('Tuesday, November 10')
    expect(formatRelativeDue('2026-11-07', '2026-11-02')).toBe('Due in 5 days')
    expect(formatRelativeDue('2026-10-31', '2026-11-02')).toBe('Due 2 days ago')
    expect(formatRelativeDue('2026-11-02', '2026-11-02')).toBe('Due today')
  })
})

describe('milestone dates', () => {
  it('formats a day, a range within a month, and a range across months', () => {
    expect(formatMonthDayRange('2026-12-15')).toBe('Dec 15')
    expect(formatMonthDayRange('2026-12-15', '2026-12-15')).toBe('Dec 15')
    expect(formatMonthDayRange('2026-11-23', '2026-11-27')).toBe('Nov 23–27')
    expect(formatMonthDayRange('2026-12-23', '2027-01-18')).toBe('Dec 23–Jan 18')
  })
})
