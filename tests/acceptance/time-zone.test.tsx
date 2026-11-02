// "All date math uses America/New_York via Intl, never the host time zone."
// Runs the tracker with the host clock in Europe/London (UTC+0 in November; DST ended Oct 25).
// Each check below would come out differently if the UI used the host zone:
//   overdue    due Sun Nov 1 8:00 PM Eastern  = Mon Nov 2 01:00 London (host "today" would include it)
//   laterToday due Mon Nov 2 11:59 PM Eastern = Tue Nov 3 04:59 London (host "today" would drop it)
//   weekEdgeDateOnly due Sun Nov 8 11:59 PM Eastern = Mon Nov 9 04:59 London (host "week" would drop it,
//   and host grouping would put it under the same day as nextWeek, Mon Nov 9 8:30 AM Eastern)

import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ids, laterToday, nextWeek, overdue, thisWeek, weekEdgeDateOnly } from './fixtures.ts'
import {
  itemEl,
  listSection,
  norm,
  renderTracker,
  termText,
  visibleIds,
  windowSelect,
} from './harness.ts'

type Env = Record<string, string | undefined>
const env = (globalThis as unknown as { process: { env: Env } }).process.env
const hostTz = env.TZ

beforeEach(() => {
  env.TZ = 'Europe/London'
})

afterEach(() => {
  cleanup()
  if (hostTz === undefined) delete env.TZ
  else env.TZ = hostTz
})

describe('host time zone independence', () => {
  it('runs with a host clock that is not Eastern', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/London')
  })

  it('formats due moments in Eastern time', async () => {
    await renderTracker()
    expect(norm(itemEl(laterToday).querySelector('time')?.textContent)).toBe(
      'Mon, Nov 2 · 11:59 PM',
    )
    expect(norm(itemEl(overdue).querySelector('time')?.textContent)).toBe('Sun, Nov 1 · 8:00 PM')
  })

  it('computes today and this week on the Eastern calendar', async () => {
    const { user } = await renderTracker()
    await user.selectOptions(windowSelect(), 'today')
    expect(visibleIds()).toEqual(ids(laterToday))
    await user.selectOptions(windowSelect(), 'week')
    expect(visibleIds()).toEqual(ids(laterToday, thisWeek, weekEdgeDateOnly))
  })

  it('groups items by Eastern calendar day', async () => {
    await renderTracker()
    const group = (a: typeof nextWeek) => itemEl(a).closest('ol')
    expect(group(weekEdgeDateOnly)).not.toBeNull()
    expect(group(weekEdgeDateOnly)).not.toBe(group(nextWeek))
    // Nine undone items on nine distinct Eastern days.
    expect(within(listSection()).getAllByRole('heading', { level: 2 })).toHaveLength(9)
  })

  it('computes the term position from midnight Eastern', async () => {
    // Same arithmetic as progress-strip.test.tsx: 31 / 3193 hours -> 0%.
    // Host-midnight (London = UTC here) would give 35 / 3192 -> 1%.
    await renderTracker({ now: new Date('2026-10-27T07:00:00-04:00') })
    expect(screen.getByTestId('progress-time')).toHaveTextContent(termText(0))
  })
})
