// The quote of the day, per docs/ui-contract.md ([data-testid="motto"] under Progress).
//
// With n = quotes.length and d = whole days from midnight Eastern on semester.start (2026-10-26)
// to midnight Eastern on now's date, the motto shows quotes[((d mod n) + n) mod n].
// d counts Eastern calendar dates, so the DST change on Sun 2026-11-01 (EDT -04:00 -> EST -05:00)
// does not shift it. Hand-derived values (fixture bank, n = 5):
//   2026-10-19 d=-7 -> 3   2026-10-25 d=-1 -> 4   2026-10-26 d=0 -> 0   2026-10-28 d=2 -> 2
//   2026-10-31 d=5  -> 0   2026-11-01 d=6  -> 1   2026-11-02 d=7 -> 2   2026-11-03 d=8 -> 3
//   2026-12-16 d=51 -> 1   2026-12-17 d=52 -> 2   2027-01-19 d=85 -> 0
// A reading of elapsed milliseconds / 24h would give d=7 at 2026-11-01T23:59:59-05:00 (the extra
// DST hour), and a UTC-date reading would roll over at 19:00 or 20:00 Eastern; the midnight pairs
// below catch both.

import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Quote } from '../../src/types.ts'
import { quotes } from './fixtures.ts'
import { norm, progressSection, renderTracker, termText, workText } from './harness.ts'

afterEach(() => {
  cleanup()
})

const at = (iso: string) => new Date(iso)

/** Asserts the motto shows exactly `q`: its text in motto-text, then author, then work. */
function expectMotto(q: Quote) {
  const motto = within(progressSection()).getByTestId('motto')
  expect(within(motto).getByTestId('motto-text').textContent).toBe(q.text)
  const full = norm(motto.textContent)
  const iText = full.indexOf(norm(q.text))
  const iAuthor = full.indexOf(norm(q.author), iText + norm(q.text).length)
  const iWork = full.indexOf(norm(q.work), iAuthor + norm(q.author).length)
  expect(iText, `motto text in "${full}"`).toBeGreaterThanOrEqual(0)
  expect(iAuthor, `author after the text in "${full}"`).toBeGreaterThanOrEqual(0)
  expect(iWork, `work after the author in "${full}"`).toBeGreaterThanOrEqual(0)
}

describe('quote of the day: presence', () => {
  it('shows the motto inside the Progress section when quotes is non-empty', async () => {
    await renderTracker()
    expect(within(progressSection()).getByTestId('motto')).toBeInTheDocument()
  })

  it('renders no motto when quotes is empty', async () => {
    await renderTracker({ quotes: [] })
    expect(screen.queryByTestId('motto')).toBeNull()
    expect(screen.queryByTestId('motto-text')).toBeNull()
  })
})

describe('quote of the day: content', () => {
  it('motto-text holds exactly the quote text, and the motto shows text, then author, then work', async () => {
    // NOW = 2026-11-02 noon EST, d = 7 -> quotes[2].
    await renderTracker()
    expectMotto(quotes[2])
  })

  it('shows a single-quote bank on every date', async () => {
    await renderTracker({ quotes: [quotes[3]], now: at('2026-12-17T09:00:00-05:00') })
    expectMotto(quotes[3])
  })
})

describe('quote of the day: index = ((d mod n) + n) mod n', () => {
  it('shows quotes[0] on semester.start (d = 0)', async () => {
    await renderTracker({ now: at('2026-10-26T12:00:00-04:00') })
    expectMotto(quotes[0])
  })

  it('shows quotes[d] on a later day within the first n days (d = 2)', async () => {
    await renderTracker({ now: at('2026-10-28T15:30:00-04:00') })
    expectMotto(quotes[2])
  })

  it('wraps a negative d before semester.start (d = -1 -> quotes[4])', async () => {
    await renderTracker({ now: at('2026-10-25T12:00:00-04:00') })
    expectMotto(quotes[4])
  })

  it('wraps a negative d more than n days before semester.start (d = -7 -> quotes[3])', async () => {
    await renderTracker({ now: at('2026-10-19T08:00:00-04:00') })
    expectMotto(quotes[3])
  })

  it('wraps around past n days (d = 5 -> quotes[0])', async () => {
    await renderTracker({ now: at('2026-10-31T12:00:00-04:00') })
    expectMotto(quotes[0])
  })

  it('wraps around past n days after the DST change (d = 8 -> quotes[3])', async () => {
    await renderTracker({ now: at('2026-11-03T08:30:00-05:00') })
    expectMotto(quotes[3])
  })

  it('wraps around many cycles later in the term (d = 85 -> quotes[0])', async () => {
    await renderTracker({ now: at('2027-01-19T09:00:00-05:00') })
    expectMotto(quotes[0])
  })

  it('uses the bank length as n (n = 3: d = 7 -> quotes[1], d = -1 -> quotes[2])', async () => {
    const bank = quotes.slice(0, 3)
    await renderTracker({ quotes: bank })
    expectMotto(bank[1])
    cleanup()
    await renderTracker({ quotes: bank, now: at('2026-10-25T12:00:00-04:00') })
    expectMotto(bank[2])
  })
})

describe('quote of the day: the switch happens at midnight Eastern', () => {
  it('switches at the semester.start midnight (EDT): 23:59:59 shows d = -1, 00:00:00 shows d = 0', async () => {
    await renderTracker({ now: at('2026-10-25T23:59:59-04:00') })
    expectMotto(quotes[4])
    cleanup()
    await renderTracker({ now: at('2026-10-26T00:00:00-04:00') })
    expectMotto(quotes[0])
  })

  it('switches at midnight before the DST change (EDT): Oct 31 23:59:59 -> d = 5, Nov 1 00:00:00 -> d = 6', async () => {
    await renderTracker({ now: at('2026-10-31T23:59:59-04:00') })
    expectMotto(quotes[0])
    cleanup()
    await renderTracker({ now: at('2026-11-01T00:00:00-04:00') })
    expectMotto(quotes[1])
  })

  it('switches at the first midnight after the DST change (EST): Nov 1 23:59:59 -> d = 6, Nov 2 00:00:00 -> d = 7', async () => {
    await renderTracker({ now: at('2026-11-01T23:59:59-05:00') })
    expectMotto(quotes[1])
    cleanup()
    await renderTracker({ now: at('2026-11-02T00:00:00-05:00') })
    expectMotto(quotes[2])
  })

  it('switches at midnight in December (EST): Dec 16 23:59:59 -> d = 51, Dec 17 00:00:00 -> d = 52', async () => {
    await renderTracker({ now: at('2026-12-16T23:59:59-05:00') })
    expectMotto(quotes[1])
    cleanup()
    await renderTracker({ now: at('2026-12-17T00:00:00-05:00') })
    expectMotto(quotes[2])
  })

  it('keeps the quote through the evening Eastern, when the UTC date has already changed', async () => {
    // 2026-11-02T21:00:00-05:00 = 2026-11-03T02:00Z; Eastern date is still Nov 2 (d = 7).
    await renderTracker({ now: at('2026-11-02T21:00:00-05:00') })
    expectMotto(quotes[2])
  })
})

describe('quote of the day: re-rendering', () => {
  it('re-rendering with a now on another Eastern date shows that date’s quote', async () => {
    const { rerenderWith, store } = await renderTracker({ now: at('2026-11-02T12:00:00-05:00') })
    expectMotto(quotes[2])
    rerenderWith({ now: at('2026-11-02T23:59:59-05:00') })
    expectMotto(quotes[2])
    rerenderWith({ now: at('2026-11-03T00:00:00-05:00') })
    expectMotto(quotes[3])
    rerenderWith({ now: at('2026-12-17T00:00:00-05:00') })
    expectMotto(quotes[2])
    expect(store.load).toHaveBeenCalledTimes(1)
  })
})

describe('quote of the day: the rest of the Progress section is unaffected', () => {
  it('keeps progress-time and progress-work correct alongside the motto', async () => {
    // now = 2027-01-19T09:00:00-05:00: term 64% (see progress-strip.test.tsx), d = 85 -> quotes[0].
    await renderTracker({ now: at('2027-01-19T09:00:00-05:00') })
    const section = progressSection()
    expect(within(section).getByTestId('progress-time')).toHaveTextContent(termText(64))
    expect(within(section).getByTestId('progress-work')).toHaveTextContent(workText(1, 10))
    expectMotto(quotes[0])
  })

  it('keeps progress-time and progress-work correct with an empty bank', async () => {
    await renderTracker({ quotes: [] })
    const section = progressSection()
    expect(within(section).getByTestId('progress-time')).toHaveTextContent(termText(5))
    expect(within(section).getByTestId('progress-work')).toHaveTextContent(workText(1, 10))
  })
})
