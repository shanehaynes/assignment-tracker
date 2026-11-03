// The progress strip: term position and work done, per docs/ui-contract.md.
//
// Term percent = floor((now - start) / (end - start) * 100), clamped to 0..100, where
//   start = midnight Eastern on 2026-10-26 = 2026-10-26T00:00:00-04:00 (EDT) = 2026-10-26T04:00Z
//   end   = midnight Eastern on 2027-03-08 = 2027-03-08T00:00:00-05:00 (EST) = 2027-03-08T05:00Z
//   end - start = 133 days + 1 hour (the DST change) = 3193 hours.

import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { progressSection, renderTracker, termText, workText } from './harness.ts'

afterEach(() => {
  cleanup()
})

describe('progress strip', () => {
  it('holds the term and work test ids inside the Progress section', async () => {
    await renderTracker()
    const section = progressSection()
    expect(within(section).getByTestId('progress-time')).toBeInTheDocument()
    expect(within(section).getByTestId('progress-work')).toBeInTheDocument()
  })

  it('shows the share of the term elapsed at the fixed now', async () => {
    // now = 2026-11-02T12:00:00-05:00 = 2026-11-02T17:00Z.
    // now - start = 7 days 13 hours = 181 hours. 181 / 3193 = 5.67% -> 5.
    await renderTracker()
    expect(screen.getByTestId('progress-time')).toHaveTextContent(termText(5))
  })

  it('shows the share of work done across all assignments', async () => {
    // 10 fixture assignments, one done in the initial progress.
    await renderTracker()
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(1, 10))
  })

  it('measures from midnight Eastern, not midnight UTC', async () => {
    // now = 2026-10-27T07:00:00-04:00 = 2026-10-27T11:00Z.
    // Eastern: 31 hours / 3193 = 0.97% -> 0. (A UTC-midnight reading gives 35 / 3192 = 1.10% -> 1.)
    await renderTracker({ now: new Date('2026-10-27T07:00:00-04:00') })
    expect(screen.getByTestId('progress-time')).toHaveTextContent(termText(0))
  })

  it('tracks mid-term position', async () => {
    // now = 2027-01-19T09:00:00-05:00 = 2027-01-19T14:00Z.
    // now - start = 85 days 10 hours = 2050 hours. 2050 / 3193 = 64.20% -> 64.
    await renderTracker({ now: new Date('2027-01-19T09:00:00-05:00') })
    expect(screen.getByTestId('progress-time')).toHaveTextContent(termText(64))
  })

  it('clamps to 0% before the term starts', async () => {
    // now = 2026-10-20 noon EDT: (now - start) is negative (-132 hours) -> clamp to 0.
    await renderTracker({ now: new Date('2026-10-20T12:00:00-04:00') })
    expect(screen.getByTestId('progress-time')).toHaveTextContent(termText(0))
  })

  it('clamps to 100% after spring break begins', async () => {
    // now = 2027-03-09 noon EST: 3229 / 3193 = 101.1% -> clamp to 100.
    await renderTracker({ now: new Date('2027-03-09T12:00:00-05:00') })
    expect(screen.getByTestId('progress-time')).toHaveTextContent(termText(100))
  })
})
