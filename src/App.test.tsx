// Contract smoke tests for docs/ui-contract.md, with a fixed `now` and fixture data.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { ASSIGNMENTS, QUOTES as SHIPPED_QUOTES } from './data.ts'
import { createMemoryStore, STORAGE_KEY, type ProgressStore } from './progress.ts'
import type { Assignment, Progress, Quote, Semester } from './types.ts'

afterEach(cleanup)

const SEMESTER: Semester = {
  label: 'Fall-2 2026 through Spring-1 2027',
  cohort: 'silver',
  timezone: 'America/New_York',
  start: '2026-10-26',
  end: '2027-03-08',
  milestones: [{ date: '2026-11-23', end: '2026-11-27', label: 'November recess' }],
}

const base = {
  sources: [{ type: 'syllabus' as const, ref: 'Syllabus p. 3' }],
  cohort_scope: 'silver' as const,
}

const ITEMS: Assignment[] = [
  {
    ...base,
    id: 'case-1',
    course: 'customer',
    title: 'Case One',
    kind: 'case_writeup',
    work: 'individual',
    due_at: '2026-11-03T08:30:00-05:00',
    due_precision: 'datetime',
    points: 10,
    description_html: '<p>Read it.<script>window.bad = 1</script></p>',
    canvas_url: 'https://yale.instructure.com/courses/1/assignments/11',
    canvas_assignment_id: 11,
    sources: [
      { type: 'canvas_assignment', ref: 'https://yale.instructure.com/courses/1/assignments/11' },
      { type: 'syllabus', ref: 'Customer syllabus, session 3' },
    ],
    notes: 'Canvas says 8:30.',
  },
  {
    ...base,
    id: 'memo-1',
    course: 'state_society',
    title: 'Memo One',
    kind: 'memo',
    work: 'individual',
    due_at: '2026-11-04T23:59:00-05:00',
    due_precision: 'date',
  },
  {
    ...base,
    id: 'hw-1',
    course: 'competitor',
    title: 'Homework One',
    kind: 'homework',
    work: 'group',
    due_at: '2026-11-06T08:30:00-05:00',
    due_precision: 'approx',
    points: 0,
  },
  {
    ...base,
    id: 'exam',
    course: 'investor',
    title: 'Final Exam',
    kind: 'exam',
    work: 'individual',
    due_at: '2026-12-17T09:00:00-05:00',
    due_precision: 'datetime',
  },
]

// Wednesday, Nov 4 2026, 9:00 AM Eastern.
const NOW = new Date('2026-11-04T14:00:00Z')

function setup(initial: Progress = {}, store: ProgressStore = createMemoryStore(initial)) {
  const load = vi.spyOn(store, 'load')
  const save = vi.spyOn(store, 'save')
  const user = userEvent.setup()
  const view = render(<App assignments={ITEMS} semester={SEMESTER} now={NOW} store={store} />)
  return { user, load, save, ...view }
}

const list = () => screen.getByRole('region', { name: 'Assignments' })
const rowIds = () =>
  [...list().querySelectorAll('li[data-assignment-id]')].map((li) =>
    li.getAttribute('data-assignment-id'),
  )
const row = (id: string) => list().querySelector<HTMLElement>(`li[data-assignment-id="${id}"]`)!

describe('App defaults', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('renders the committed data with no props, falling back to localStorage for progress', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    const [first, second] = ASSIGNMENTS
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ [first.id]: { done: true, at: '2026-11-01T12:00:00.000Z' } }),
    )
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Assignments' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId('progress-work')).toHaveTextContent(
        `1 of ${ASSIGNMENTS.length} done`,
      ),
    )
    await user.click(screen.getByRole('checkbox', { name: 'Hide done' }))
    expect(within(row(first.id)).getByRole('checkbox')).toBeChecked()

    await user.click(within(row(second.id)).getByRole('checkbox'))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toHaveProperty([second.id])
  })
})

describe('App contract', () => {
  it('renders the landmarks, progress and sorted rows', async () => {
    const { load } = setup()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'Assignments' }),
    )
    const progress = screen.getByRole('region', { name: 'Progress' })
    expect(within(progress).getByTestId('progress-time')).toHaveTextContent('7% of the term')
    expect(within(progress).getByTestId('progress-work')).toHaveTextContent('0 of 4 done')
    expect(rowIds()).toEqual(['case-1', 'memo-1', 'hw-1', 'exam'])
  })

  it('shows each row the contract asks for', () => {
    setup()
    const r = within(row('case-1'))
    const time = row('case-1').querySelector('time')!
    expect(time).toHaveAttribute('dateTime', '2026-11-03T08:30:00-05:00')
    expect(time).toHaveTextContent('Tue, Nov 3 · 8:30 AM')
    expect(r.getByText('Customer')).toBeInTheDocument()
    expect(r.getByRole('button', { name: 'Case One' })).toBeInTheDocument()
    expect(r.getByText('Individual')).toBeInTheDocument()
    expect(r.getByRole('checkbox', { name: 'Done: Case One' })).not.toBeChecked()
    expect(r.getByText('Overdue')).toBeInTheDocument()

    expect(row('memo-1').querySelector('time')).toHaveTextContent(/^Wed, Nov 4$/)
    expect(within(row('memo-1')).queryByText('Overdue')).toBeNull()
    expect(row('hw-1').querySelector('time')).toHaveTextContent('Fri, Nov 6 · 8:30 AM (approx.)')
    expect(within(row('hw-1')).getByText('Group')).toBeInTheDocument()
    expect(within(row('hw-1')).getByText('Competitor')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Yesterday · Tuesday, November 3',
      'Today · Wednesday, November 4',
      'Friday, November 6',
      'Thursday, December 17',
    ])
  })

  it('toggles done, saves the whole object, and hides the row', async () => {
    const { user, save } = setup({ exam: { done: true, at: '2026-11-01T12:00:00.000Z' } })
    await waitFor(() => expect(rowIds()).not.toContain('exam'))
    expect(screen.getByTestId('progress-work')).toHaveTextContent('1 of 4 done')

    await user.click(screen.getByRole('checkbox', { name: 'Done: Case One' }))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][0]).toEqual({
      exam: { done: true, at: '2026-11-01T12:00:00.000Z' },
      'case-1': { done: true, at: NOW.toISOString() },
    })
    expect(screen.getByTestId('progress-work')).toHaveTextContent('2 of 4 done')
    expect(rowIds()).not.toContain('case-1')

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(rowIds()).toContain('case-1')
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1][0]).toEqual({ exam: { done: true, at: '2026-11-01T12:00:00.000Z' } })

    await user.click(screen.getByRole('checkbox', { name: 'Hide done' }))
    expect(screen.getByRole('checkbox', { name: 'Done: Final Exam' })).toBeChecked()
    expect(within(row('exam')).queryByText('Overdue')).toBeNull()
  })

  it('moves keyboard focus to the next row when a done row disappears', async () => {
    const { user } = setup()
    const box = screen.getByRole('checkbox', { name: 'Done: Case One' })
    box.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('checkbox', { name: 'Done: Memo One' })).toHaveFocus()
  })

  it('composes course, window, kind and hide-done filters', async () => {
    const { user } = setup()
    const form = screen.getByRole('form', { name: 'Filters' })
    for (const name of ['Customer', 'Competitor', 'Investor', 'State & Society'])
      expect(within(form).getByRole('checkbox', { name })).toBeChecked()
    expect(within(form).getByRole('checkbox', { name: 'Hide done' })).toBeChecked()

    await user.click(within(form).getByRole('checkbox', { name: 'Customer' }))
    expect(rowIds()).toEqual(['memo-1', 'hw-1', 'exam'])

    const windowSelect = within(form).getByRole('combobox', { name: 'Window' })
    expect([...(windowSelect as HTMLSelectElement).options].map((o) => [o.value, o.text])).toEqual([
      ['all', 'All'],
      ['today', 'Today'],
      ['week', 'This week'],
      ['fortnight', 'Next two weeks'],
      ['past', 'Past due'],
    ])
    await user.selectOptions(windowSelect, 'today')
    expect(rowIds()).toEqual(['memo-1'])
    await user.selectOptions(windowSelect, 'week')
    expect(rowIds()).toEqual(['memo-1', 'hw-1'])

    await user.selectOptions(within(form).getByRole('combobox', { name: 'Kind' }), 'exam')
    expect(rowIds()).toEqual([])
    expect(within(list()).getByText('Nothing due')).toBeInTheDocument()

    await user.click(within(form).getByRole('button', { name: 'Reset filters' }))
    expect(rowIds()).toEqual(['case-1', 'memo-1', 'hw-1', 'exam'])
    expect(within(form).getByRole('checkbox', { name: 'Customer' })).toHaveFocus()
  })

  it('keeps the panel open when its item is filtered out, and closing it lands focus on the list', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Case One' }))
    const form = screen.getByRole('form', { name: 'Filters' })
    await user.click(within(form).getByRole('checkbox', { name: 'Customer' }))
    expect(rowIds()).not.toContain('case-1')
    const aside = screen.getByRole('complementary', { name: 'Assignment detail' })
    await user.click(within(aside).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('complementary', { name: 'Assignment detail' })).toBeNull()
    expect(list()).toHaveFocus()
  })

  it('closes the panel when the open title is pressed again', async () => {
    const { user } = setup()
    const trigger = screen.getByRole('button', { name: 'Case One' })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(screen.queryByRole('complementary', { name: 'Assignment detail' })).toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('keeps the Undo note while Undo has focus, and clears it on a filter change or Escape', async () => {
    vi.useFakeTimers()
    try {
      setup()
      await act(async () => {})
      const undoButton = () => screen.queryByRole('button', { name: 'Undo' })

      fireEvent.click(screen.getByRole('checkbox', { name: 'Done: Case One' }))
      act(() => undoButton()!.focus())
      act(() => vi.advanceTimersByTime(30_000))
      expect(undoButton()).toHaveFocus()
      act(() => undoButton()!.blur())
      act(() => vi.advanceTimersByTime(12_000))
      expect(undoButton()).toBeNull()

      fireEvent.click(screen.getByRole('checkbox', { name: 'Done: Memo One' }))
      expect(undoButton()).not.toBeNull()
      fireEvent.change(screen.getByRole('combobox', { name: 'Window' }), {
        target: { value: 'week' },
      })
      expect(undoButton()).toBeNull()

      fireEvent.click(screen.getByRole('checkbox', { name: 'Done: Homework One' }))
      act(() => undoButton()!.focus())
      fireEvent.keyDown(undoButton()!, { key: 'Escape' })
      expect(undoButton()).toBeNull()
      expect(list()).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('lists every milestone once, in a Milestones disclosure under the term meter', () => {
    setup()
    const progress = screen.getByRole('region', { name: 'Progress' })
    const details = progress.querySelector('details.milestones')
    expect(details?.querySelector('summary')).toHaveTextContent('Milestones')
    expect([...(details?.querySelectorAll('li') ?? [])].map((li) => li.textContent)).toEqual([
      'Nov 23–27: November recess',
    ])
    const ticks = progress.querySelector('ol.ticks')
    expect(ticks).toHaveAttribute('aria-hidden', 'true')
    expect(ticks?.textContent).toBe('')
    expect(ticks?.querySelector('[title]')).toBeNull()
  })

  it('opens the detail panel, sanitizes, links out, and closes with Escape', async () => {
    const { user } = setup()
    expect(screen.queryByRole('complementary', { name: 'Assignment detail' })).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Case One' })
    await user.click(trigger)

    const aside = screen.getByRole('complementary', { name: 'Assignment detail' })
    const heading = within(aside).getByRole('heading')
    expect(heading).toHaveAccessibleName('Case One')
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveFocus()
    expect(within(aside).getByText('Tue, Nov 3 · 8:30 AM')).toBeInTheDocument()
    const description = within(aside).getByTestId('description')
    expect(description).toHaveTextContent('Read it.')
    expect(description.innerHTML).not.toContain('script')
    const sources = within(aside).getByRole('list', { name: 'Sources' })
    expect(within(sources).getAllByRole('listitem')).toHaveLength(2)
    expect(
      within(sources).getByRole('link', {
        name: 'https://yale.instructure.com/courses/1/assignments/11',
      }),
    ).toBeInTheDocument()
    expect(within(sources).getByText('Customer syllabus, session 3')).toBeInTheDocument()
    expect(within(aside).getByText('Canvas says 8:30.')).toBeInTheDocument()
    const canvas = within(aside).getByRole('link', { name: 'Open in Canvas' })
    expect(canvas).toHaveAttribute('href', 'https://yale.instructure.com/courses/1/assignments/11')
    expect(canvas).toHaveAttribute('target', '_blank')
    expect(canvas).toHaveAttribute('rel', 'noreferrer')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('complementary', { name: 'Assignment detail' })).toBeNull()
    expect(trigger).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Memo One' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('complementary', { name: 'Assignment detail' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Memo One' })).toHaveFocus()
  })

  it('saves a toggle made before load at once, then replays it onto the loaded progress', async () => {
    let resolve: (p: Progress) => void = () => {}
    const store: ProgressStore = {
      load: () => new Promise<Progress>((r) => (resolve = r)),
      save: async () => {},
    }
    const { save } = setup({}, store)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Done: Memo One' }))
    expect(save).toHaveBeenCalledTimes(1)
    expect(Object.keys(save.mock.calls[0][0])).toEqual(['memo-1'])
    await act(async () => resolve({ exam: { done: true, at: 'earlier' } }))
    expect(save).toHaveBeenCalledTimes(2)
    expect(Object.keys(save.mock.calls[1][0]).sort()).toEqual(['exam', 'memo-1'])
    expect(screen.getByTestId('progress-work')).toHaveTextContent('2 of 4 done')
  })

  it('does not save twice when the loaded progress adds nothing', async () => {
    const store = createMemoryStore()
    const { save } = setup({}, store)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Done: Memo One' }))
    expect(save).toHaveBeenCalledTimes(1)
    await act(async () => {})
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('says so, quietly, when a save fails', async () => {
    const store = createMemoryStore()
    const { user } = setup({}, store)
    vi.spyOn(store, 'save').mockRejectedValue(new Error('disk full'))
    await waitFor(() => expect(screen.getByTestId('progress-work')).toBeInTheDocument())
    await act(async () => {})
    await user.click(screen.getByRole('checkbox', { name: 'Done: Final Exam' }))
    expect(await screen.findByText('Not saved')).toBeInTheDocument()
    expect(screen.getByTestId('progress-work')).toHaveTextContent('1 of 4 done')
  })
})

describe('Quote of the day', () => {
  const QUOTES: Quote[] = [
    {
      text: 'Even line.',
      author: 'First Author',
      work: 'First Work',
      source_url: 'https://a.test',
    },
    {
      text: 'Odd line.',
      author: 'Second Author',
      work: 'Second Work',
      source_url: 'https://b.test',
    },
  ]
  const show = (now: Date, quotes: Quote[] = QUOTES) =>
    render(
      <App
        assignments={ITEMS}
        semester={SEMESTER}
        now={now}
        store={createMemoryStore()}
        quotes={quotes}
      />,
    )
  const progress = () => screen.getByRole('region', { name: 'Progress' })

  it('shows the quote for the Eastern day, with its attribution after the text', () => {
    // NOW is Nov 4, day 9 of a term starting Oct 26: 9 mod 2 = 1.
    show(NOW)
    const motto = within(progress()).getByTestId('motto')
    expect(within(motto).getByTestId('motto-text').textContent).toBe('Odd line.')
    expect(motto).toHaveTextContent(/^Odd line\.\s*— Second Author, Second Work$/)
  })

  it('switches quotes at midnight Eastern', () => {
    const { rerender } = show(new Date('2026-11-04T23:59:59-05:00'))
    expect(screen.getByTestId('motto-text').textContent).toBe('Odd line.')
    rerender(
      <App
        assignments={ITEMS}
        semester={SEMESTER}
        now={new Date('2026-11-05T00:00:00-05:00')}
        store={createMemoryStore()}
        quotes={QUOTES}
      />,
    )
    expect(screen.getByTestId('motto-text').textContent).toBe('Even line.')
  })

  it('renders no motto when the bank is empty', () => {
    show(NOW, [])
    expect(within(progress()).queryByTestId('motto')).not.toBeInTheDocument()
  })

  it('draws from the shipped bank when no quotes prop is given', () => {
    render(<App assignments={ITEMS} semester={SEMESTER} now={NOW} store={createMemoryStore()} />)
    // NOW is day 9 of a term starting Oct 26, the same start data/semester.json uses.
    const expected = SHIPPED_QUOTES[9 % SHIPPED_QUOTES.length]
    expect(within(progress()).getByTestId('motto-text').textContent).toBe(expected.text)
  })
})
