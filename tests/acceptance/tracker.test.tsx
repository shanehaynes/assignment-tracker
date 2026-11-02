// Acceptance tests for the Phase-1 tracker, written against docs/ui-contract.md only.
// NOW is Mon Nov 2 2026, 12:00 PM Eastern (see fixtures.ts for each item's role).

import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assignments,
  COURSE_LABEL,
  createTestStore,
  december,
  doneInitially,
  fortnightEdge,
  ids,
  initialProgress,
  KIND_OPTIONS,
  laterToday,
  marchApprox,
  nextWeek,
  overdue,
  pastFortnight,
  thisWeek,
  weekEdgeDateOnly,
  WINDOW_OPTIONS,
} from './fixtures.ts'
import {
  courseBox,
  doneBox,
  filtersForm,
  getDetail,
  hideDoneBox,
  itemEl,
  kindSelect,
  listSection,
  norm,
  progressSection,
  queryDetail,
  renderTracker,
  visibleIds,
  windowSelect,
  workText,
} from './harness.ts'

afterEach(() => {
  cleanup()
})

// Every undone item, in due order. doneInitially is hidden by the default "Hide done".
const ALL_UNDONE = ids(
  overdue, // Sun Nov 1  8:00 PM
  laterToday, // Mon Nov 2  11:59 PM
  thisWeek, // Thu Nov 5  8:30 AM
  weekEdgeDateOnly, // Sun Nov 8  (date)
  nextWeek, // Mon Nov 9  8:30 AM
  fortnightEdge, // Mon Nov 16 11:59 PM
  pastFortnight, // Tue Nov 17 8:30 AM
  december, // Thu Dec 17 9:00 AM
  marchApprox, // Wed Mar 3  (approx)
)

const ALL_ITEMS = ids(
  overdue,
  doneInitially, // Sun Nov 1 11:59 PM (date), after overdue on the same day
  laterToday,
  thisWeek,
  weekEdgeDateOnly,
  nextWeek,
  fortnightEdge,
  pastFortnight,
  december,
  marchApprox,
)

const optionPairs = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((o) => [(o as HTMLOptionElement).value, norm(o.textContent)])

describe('fixtures', () => {
  it('keep marker words out of item text so substring checks are unambiguous', () => {
    const markers = [
      'Group',
      'Individual',
      'Overdue',
      'Nothing due',
      ...Object.values(COURSE_LABEL),
    ]
    for (const a of assignments) {
      for (const text of [a.title, a.group_note ?? '', a.notes ?? '']) {
        for (const m of markers) expect(text, `${a.id}: ${m}`).not.toContain(m)
      }
    }
  })
})

describe('landmarks', () => {
  it('renders the header, progress strip, filters and list, and loads progress once', async () => {
    const { store } = await renderTracker()
    const h1 = screen.getByRole('heading', { level: 1, name: 'Assignments' })
    expect(h1.closest('header')).not.toBeNull()
    expect(progressSection()).toBeInTheDocument()
    expect(filtersForm()).toBeInTheDocument()
    expect(listSection()).toBeInTheDocument()
    expect(store.load).toHaveBeenCalledTimes(1)
  })
})

describe('assignment list', () => {
  it('lists every undone item by default, sorted by due_at', async () => {
    await renderTracker()
    expect(visibleIds()).toEqual(ALL_UNDONE)
    expect(listSection()).not.toHaveTextContent(/Nothing due/)
  })

  it('groups items under one h2 per Eastern calendar day, each with its own ol', async () => {
    const { user } = await renderTracker()
    await user.click(hideDoneBox())
    expect(visibleIds()).toEqual(ALL_ITEMS)

    const section = listSection()
    const lists = Array.from(section.querySelectorAll('ol')).filter((ol) =>
      ol.querySelector('li[data-assignment-id]'),
    )
    const groups = lists.map((ol) =>
      Array.from(ol.querySelectorAll('li[data-assignment-id]')).map((li) =>
        li.getAttribute('data-assignment-id'),
      ),
    )
    // Nine distinct Eastern days; Sun Nov 1 holds two items, in due order.
    expect(groups).toEqual([
      ids(overdue, doneInitially),
      ids(laterToday),
      ids(thisWeek),
      ids(weekEdgeDateOnly),
      ids(nextWeek),
      ids(fortnightEdge),
      ids(pastFortnight),
      ids(december),
      ids(marchApprox),
    ])

    const headings = within(section).getAllByRole('heading', { level: 2 })
    expect(headings).toHaveLength(lists.length)
    const texts = headings.map((h) => norm(h.textContent))
    expect(texts.every((t) => t.length > 0)).toBe(true)
    expect(new Set(texts).size).toBe(texts.length)
    // Heading i comes before list i, and after list i-1.
    headings.forEach((h, i) => {
      expect(h.compareDocumentPosition(lists[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      if (i > 0) {
        expect(
          lists[i - 1].compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
      }
    })
    // The December group's heading names its day.
    expect(texts[7]).toMatch(/Dec(ember)?\.?\s+17\b|\b17\s+Dec|12\/17/)
  })

  it('shows due time, course, title button, work type and done checkbox on every item', async () => {
    const { user } = await renderTracker()
    await user.click(hideDoneBox())
    for (const a of assignments) {
      const li = itemEl(a)
      const time = li.querySelector('time')
      expect(time, a.id).not.toBeNull()
      expect(time).toHaveAttribute('datetime', a.due_at)
      expect(li).toHaveTextContent(COURSE_LABEL[a.course])
      expect(within(li).getByRole('button', { name: a.title })).toBeInTheDocument()
      if (a.work === 'group') {
        expect(li).toHaveTextContent('Group')
        expect(li).not.toHaveTextContent('Individual')
      } else {
        expect(li).toHaveTextContent('Individual')
        expect(li).not.toHaveTextContent('Group')
      }
      const box = within(li).getByRole('checkbox', { name: `Done: ${a.title}` })
      if (initialProgress[a.id]?.done) expect(box).toBeChecked()
      else expect(box).not.toBeChecked()
    }
  })

  it('formats due moments in Eastern time according to due_precision', async () => {
    await renderTracker()
    const timeText = (a: (typeof assignments)[number]) =>
      norm(itemEl(a).querySelector('time')?.textContent)

    // datetime: weekday, month, day, then the time.
    expect(timeText(laterToday)).toBe('Mon, Nov 2 · 11:59 PM')
    expect(timeText(thisWeek)).toBe('Thu, Nov 5 · 8:30 AM')
    expect(timeText(december)).toBe('Thu, Dec 17 · 9:00 AM')

    // date: no time of day.
    const dateOnly = timeText(weekEdgeDateOnly)
    expect(dateOnly.startsWith('Sun, Nov 8')).toBe(true)
    expect(dateOnly).not.toMatch(/\d:\d\d|\b[AP]M\b/)

    // approx: the moment followed by "(approx.)".
    const approx = timeText(marchApprox)
    expect(approx.startsWith('Wed, Mar 3')).toBe(true)
    expect(approx.endsWith('(approx.)')).toBe(true)
  })

  it('marks only past-due, undone items Overdue', async () => {
    const { user } = await renderTracker()
    await user.click(hideDoneBox())
    expect(itemEl(overdue)).toHaveTextContent('Overdue')
    // Past due but done.
    expect(itemEl(doneInitially)).not.toHaveTextContent('Overdue')
    // Due later today and after: not overdue.
    for (const a of [laterToday, thisWeek, weekEdgeDateOnly, nextWeek, fortnightEdge]) {
      expect(itemEl(a), a.id).not.toHaveTextContent('Overdue')
    }
    for (const a of [pastFortnight, december, marchApprox]) {
      expect(itemEl(a), a.id).not.toHaveTextContent('Overdue')
    }
  })

  it('drops the Overdue mark when a past-due item is checked done', async () => {
    const { user } = await renderTracker()
    await user.click(hideDoneBox())
    await user.click(doneBox(overdue))
    expect(doneBox(overdue)).toBeChecked()
    expect(itemEl(overdue)).not.toHaveTextContent('Overdue')
  })
})

describe('course filter', () => {
  it('has one checkbox per course, all checked by default', async () => {
    await renderTracker()
    for (const label of ['Customer', 'Competitor', 'Investor', 'State & Society']) {
      expect(courseBox(label)).toBeChecked()
    }
  })

  it("unchecking a course removes only that course's items, and rechecking restores them", async () => {
    const { user } = await renderTracker()
    await user.click(courseBox('Customer'))
    expect(courseBox('Customer')).not.toBeChecked()
    expect(visibleIds()).toEqual(
      ids(overdue, thisWeek, weekEdgeDateOnly, fortnightEdge, december, marchApprox),
    )

    await user.click(courseBox('State & Society'))
    expect(visibleIds()).toEqual(ids(overdue, thisWeek, fortnightEdge, december))

    await user.click(courseBox('Customer'))
    await user.click(courseBox('State & Society'))
    expect(visibleIds()).toEqual(ALL_UNDONE)
  })
})

describe('window filter', () => {
  it('offers the five contract options and defaults to All', async () => {
    await renderTracker()
    const select = windowSelect()
    expect(select).toHaveValue('all')
    expect(optionPairs(select).sort()).toEqual([...WINDOW_OPTIONS].sort())
  })

  it.each<{ value: string; why: string; expected: string[] }>([
    {
      value: 'today',
      why: 'due on Mon Nov 2 in Eastern time',
      expected: ids(laterToday),
    },
    {
      value: 'week',
      why: 'Mon Nov 2 00:00 through Sun Nov 8 23:59; Mon Nov 9 is next week',
      expected: ids(laterToday, thisWeek, weekEdgeDateOnly),
    },
    {
      value: 'fortnight',
      why: 'Mon Nov 2 00:00 through Mon Nov 16 23:59 inclusive; Tue Nov 17 is out',
      expected: ids(laterToday, thisWeek, weekEdgeDateOnly, nextWeek, fortnightEdge),
    },
    {
      value: 'past',
      why: 'due before now; the done past item is hidden by Hide done',
      expected: ids(overdue),
    },
    {
      value: 'all',
      why: 'every undone item',
      expected: ALL_UNDONE,
    },
  ])('"$value" keeps items $why', async ({ value, expected }) => {
    const { user } = await renderTracker()
    await user.selectOptions(windowSelect(), value)
    expect(windowSelect()).toHaveValue(value)
    expect(visibleIds()).toEqual(expected)
  })

  it('"past" includes done past items once Hide done is off', async () => {
    const { user } = await renderTracker()
    await user.selectOptions(windowSelect(), 'past')
    await user.click(hideDoneBox())
    expect(visibleIds()).toEqual(ids(overdue, doneInitially))
  })

  it('windows start at midnight today, not at the start of the week', async () => {
    // Thu Nov 5, 7:00 AM Eastern.
    const { user } = await renderTracker({ now: new Date('2026-11-05T07:00:00-05:00') })

    await user.selectOptions(windowSelect(), 'today')
    expect(visibleIds()).toEqual(ids(thisWeek))

    // Thu Nov 5 00:00 through Sun Nov 8 23:59: Monday's item is no longer in the window.
    await user.selectOptions(windowSelect(), 'week')
    expect(visibleIds()).toEqual(ids(thisWeek, weekEdgeDateOnly))

    // Thu Nov 5 00:00 through Thu Nov 19 23:59.
    await user.selectOptions(windowSelect(), 'fortnight')
    expect(visibleIds()).toEqual(
      ids(thisWeek, weekEdgeDateOnly, nextWeek, fortnightEdge, pastFortnight),
    )

    await user.selectOptions(windowSelect(), 'past')
    expect(visibleIds()).toEqual(ids(overdue, laterToday))
  })

  it('an item due earlier today is in both Today and Past due, and is Overdue', async () => {
    // Thu Nov 5, 9:00 AM Eastern: thisWeek (8:30 AM today) is now past due.
    const { user } = await renderTracker({ now: new Date('2026-11-05T09:00:00-05:00') })

    await user.selectOptions(windowSelect(), 'today')
    expect(visibleIds()).toEqual(ids(thisWeek))
    expect(itemEl(thisWeek)).toHaveTextContent('Overdue')

    // "Past due" compares with now, not with midnight today.
    await user.selectOptions(windowSelect(), 'past')
    expect(visibleIds()).toEqual(ids(overdue, laterToday, thisWeek))
  })
})

describe('kind filter', () => {
  it('offers All kinds plus every kind and defaults to All kinds', async () => {
    await renderTracker()
    const select = kindSelect()
    expect(select).toHaveValue('all')
    expect(optionPairs(select).sort()).toEqual([...KIND_OPTIONS].sort())
  })

  it('keeps only items of the selected kind', async () => {
    const { user } = await renderTracker()
    await user.selectOptions(kindSelect(), 'homework')
    expect(visibleIds()).toEqual(ids(overdue, thisWeek, fortnightEdge))

    await user.selectOptions(kindSelect(), 'exam')
    expect(visibleIds()).toEqual(ids(december))

    await user.selectOptions(kindSelect(), 'case_writeup')
    expect(visibleIds()).toEqual(ids(laterToday, pastFortnight))

    // The only admin item is done, so Hide done empties the list.
    await user.selectOptions(kindSelect(), 'admin')
    expect(visibleIds()).toEqual([])
    expect(listSection()).toHaveTextContent(/Nothing due/)
    await user.click(hideDoneBox())
    expect(visibleIds()).toEqual(ids(doneInitially))
  })
})

describe('hide done', () => {
  it('is checked by default and hides done items', async () => {
    await renderTracker()
    expect(hideDoneBox()).toBeChecked()
    expect(visibleIds()).not.toContain(doneInitially.id)
  })

  it('when unchecked, shows done items in order with their Done box checked', async () => {
    const { user } = await renderTracker()
    await user.click(hideDoneBox())
    expect(hideDoneBox()).not.toBeChecked()
    expect(visibleIds()).toEqual(ALL_ITEMS)
    expect(within(itemEl(doneInitially)).getByRole('checkbox')).toBeChecked()
    expect(doneBox(doneInitially)).toBeChecked()
  })
})

describe('filters compose', () => {
  it('applies course, window, kind and hide-done together', async () => {
    const { user } = await renderTracker()
    await user.click(courseBox('Customer'))
    await user.selectOptions(windowSelect(), 'fortnight')
    await user.selectOptions(kindSelect(), 'homework')
    expect(visibleIds()).toEqual(ids(thisWeek, fortnightEdge))

    await user.click(courseBox('Competitor'))
    expect(visibleIds()).toEqual(ids(fortnightEdge))

    await user.selectOptions(windowSelect(), 'past')
    expect(visibleIds()).toEqual(ids(overdue))
  })

  it('shows "Nothing due" when the filters exclude everything', async () => {
    const { user } = await renderTracker()
    for (const label of ['Customer', 'Competitor', 'Investor', 'State & Society']) {
      await user.click(courseBox(label))
    }
    expect(visibleIds()).toEqual([])
    expect(listSection()).toHaveTextContent(/Nothing due/)

    await user.click(courseBox('Investor'))
    expect(visibleIds()).toEqual(ids(overdue, fortnightEdge))
    expect(listSection()).not.toHaveTextContent(/Nothing due/)
  })
})

describe('done toggle', () => {
  it('treats an item done in the loaded progress as done', async () => {
    const { user } = await renderTracker()
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(1, 10))
    expect(visibleIds()).not.toContain(doneInitially.id)
    await user.click(hideDoneBox())
    expect(doneBox(doneInitially)).toBeChecked()
    expect(itemEl(doneInitially)).not.toHaveTextContent('Overdue')
  })

  it('checking Done updates the list and the count, and saves the full progress', async () => {
    const { store, user } = await renderTracker()
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(1, 10))
    const savesBefore = store.save.mock.calls.length

    await user.click(doneBox(laterToday))

    // Hide done is on, so the item leaves the list at once.
    expect(visibleIds()).toEqual(ALL_UNDONE.filter((id) => id !== laterToday.id))
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(2, 10))

    expect(store.save.mock.calls.length).toBeGreaterThan(savesBefore)
    const saved = store.save.mock.lastCall?.[0]
    expect(saved).toBeDefined()
    expect(Object.keys(saved ?? {}).sort()).toEqual([doneInitially.id, laterToday.id].sort())
    expect(saved?.[doneInitially.id]).toEqual(initialProgress[doneInitially.id])
    expect(saved?.[laterToday.id]?.done).toBe(true)
    expect(Number.isNaN(Date.parse(saved?.[laterToday.id]?.at ?? ''))).toBe(false)
  })

  it('checking Done with Hide done off keeps the item, checked', async () => {
    const { user } = await renderTracker()
    await user.click(hideDoneBox())
    await user.click(doneBox(thisWeek))
    expect(visibleIds()).toEqual(ALL_ITEMS)
    expect(doneBox(thisWeek)).toBeChecked()
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(2, 10))
  })

  it('unchecking a done item updates the count and saves progress without it', async () => {
    const { store, user } = await renderTracker()
    await user.click(hideDoneBox())
    await user.click(doneBox(doneInitially))
    expect(doneBox(doneInitially)).not.toBeChecked()
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(0, 10))
    const saved = store.save.mock.lastCall?.[0]
    expect(saved).toBeDefined()
    expect(saved?.[doneInitially.id]?.done).not.toBe(true)
  })

  it('counts done work across every assignment regardless of filters', async () => {
    const { user } = await renderTracker()
    await user.click(courseBox('Investor'))
    await user.selectOptions(kindSelect(), 'exam')
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(1, 10))
  })

  it('a check survives a restart with the same store', async () => {
    const store = createTestStore()
    const first = await renderTracker({ store })
    await first.user.click(doneBox(nextWeek))
    first.unmount()

    expect(store.snapshot()[nextWeek.id]?.done).toBe(true)
    const second = await renderTracker({ store })
    expect(screen.getByTestId('progress-work')).toHaveTextContent(workText(2, 10))
    await second.user.click(hideDoneBox())
    expect(doneBox(nextWeek)).toBeChecked()
  })
})

describe('detail panel', () => {
  it('is not rendered until an item is selected', async () => {
    await renderTracker()
    expect(queryDetail()).toBeNull()
  })

  it('opens from the title button with title, due moment, description, sources, notes and Canvas link', async () => {
    const { user } = await renderTracker()
    await user.click(within(itemEl(thisWeek)).getByRole('button', { name: thisWeek.title }))

    const aside = getDetail()
    expect(within(aside).getByRole('heading', { level: 2, name: thisWeek.title })).toBeVisible()
    expect(norm(aside.textContent)).toContain('Thu, Nov 5')
    expect(norm(aside.textContent)).toContain('8:30 AM')

    const description = within(aside).getByTestId('description')
    expect(description).toHaveTextContent('Answer both questions and show your work.')
    expect(description.querySelector('strong')).toHaveTextContent('your work')

    const sources = within(aside).getByRole('list', { name: 'Sources' })
    const sourceItems = within(sources).getAllByRole('listitem')
    expect(sourceItems).toHaveLength(thisWeek.sources.length)
    for (const s of thisWeek.sources) {
      if (/^https?:\/\//.test(s.ref)) {
        const linked = sourceItems.filter((li) =>
          Array.from(li.querySelectorAll('a')).some((a) => a.getAttribute('href') === s.ref),
        )
        expect(linked, s.ref).toHaveLength(1)
      } else {
        const holder = sourceItems.find((li) => norm(li.textContent).includes(s.ref))
        expect(holder, s.ref).toBeDefined()
        expect(holder?.querySelector('a')).toBeNull()
      }
    }

    expect(aside).toHaveTextContent(thisWeek.notes ?? '')

    const canvasLink = within(aside).getByRole('link', { name: 'Open in Canvas' })
    expect(canvasLink).toHaveAttribute('href', thisWeek.canvas_url)
    expect(canvasLink).toHaveAttribute('target', '_blank')
    expect((canvasLink.getAttribute('rel') ?? '').split(/\s+/)).toContain('noreferrer')
  })

  it('shows the notes of the item that was opened', async () => {
    const { user } = await renderTracker()
    await user.click(within(itemEl(marchApprox)).getByRole('button', { name: marchApprox.title }))
    const aside = getDetail()
    expect(within(aside).getByRole('heading', { level: 2, name: marchApprox.title })).toBeVisible()
    expect(aside).toHaveTextContent(marchApprox.notes ?? '')
    expect(within(aside).getByRole('link', { name: 'Open in Canvas' })).toHaveAttribute(
      'href',
      marchApprox.canvas_url,
    )
  })

  it('renders description HTML sanitized: no script element, no inline handlers, nothing ran', async () => {
    const { user } = await renderTracker()
    await user.click(within(itemEl(thisWeek)).getByRole('button', { name: thisWeek.title }))
    const description = within(getDetail()).getByTestId('description')
    expect(description.querySelector('script')).toBeNull()
    expect(description.querySelector('[onerror]')).toBeNull()
    expect(description.innerHTML).not.toMatch(/<script|onerror|__acceptanceScriptRan/i)
    expect((window as unknown as Record<string, unknown>).__acceptanceScriptRan).toBeUndefined()
  })

  it('closes with the Close button', async () => {
    const { user } = await renderTracker()
    await user.click(within(itemEl(thisWeek)).getByRole('button', { name: thisWeek.title }))
    await user.click(within(getDetail()).getByRole('button', { name: 'Close' }))
    expect(queryDetail()).toBeNull()
  })

  it('closes with Escape', async () => {
    const { user } = await renderTracker()
    await user.click(within(itemEl(thisWeek)).getByRole('button', { name: thisWeek.title }))
    expect(getDetail()).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(queryDetail()).toBeNull()
  })
})
