// Render and query helpers for the acceptance tests. Plain .ts (createElement, no JSX).

import { createElement, type ComponentType } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import App from '../../src/App.tsx'
import type { Assignment, Semester } from '../../src/types.ts'
import {
  assignments as defaultAssignments,
  createTestStore,
  NOW,
  semester as defaultSemester,
  type TestStore,
  type TrackerProps,
} from './fixtures.ts'

const Tracker = App as unknown as ComponentType<TrackerProps>

export type RenderOptions = {
  assignments?: Assignment[]
  semester?: Semester
  now?: Date
  store?: TestStore
}

/** Renders the tracker and waits until its single store.load() call has resolved and been applied. */
export async function renderTracker(options: RenderOptions = {}) {
  const store = options.store ?? createTestStore()
  const user = userEvent.setup()
  const loadsBefore = store.load.mock.calls.length
  const props: TrackerProps = {
    assignments: options.assignments ?? defaultAssignments,
    semester: options.semester ?? defaultSemester,
    now: options.now ?? NOW,
    store,
  }
  const view = render(createElement(Tracker, props))
  await waitFor(() => expect(store.load).toHaveBeenCalledTimes(loadsBefore + 1))
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return { ...view, store, user, props }
}

/** Collapses every whitespace run (including no-break and narrow no-break spaces) to one space. */
export const norm = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim()

export const listSection = () => screen.getByRole('region', { name: 'Assignments' })
export const progressSection = () => screen.getByRole('region', { name: 'Progress' })
export const filtersForm = () => screen.getByRole('form', { name: 'Filters' })
export const windowSelect = () => within(filtersForm()).getByRole('combobox', { name: 'Window' })
export const kindSelect = () => within(filtersForm()).getByRole('combobox', { name: 'Kind' })
export const hideDoneBox = () => within(filtersForm()).getByRole('checkbox', { name: 'Hide done' })
export const courseBox = (label: string) =>
  within(filtersForm()).getByRole('checkbox', { name: label })

export const itemEls = () =>
  Array.from(listSection().querySelectorAll<HTMLLIElement>('li[data-assignment-id]'))

/** Ids of the visible list items, in document order. */
export const visibleIds = () => itemEls().map((li) => li.getAttribute('data-assignment-id'))

export function itemEl(a: Assignment): HTMLLIElement {
  const li = listSection().querySelector<HTMLLIElement>(`li[data-assignment-id="${a.id}"]`)
  if (!li) throw new Error(`No list item for ${a.id}; visible: ${visibleIds().join(', ')}`)
  return li
}

export const doneBox = (a: Assignment) =>
  within(listSection()).getByRole('checkbox', { name: `Done: ${a.title}` })

export const queryDetail = () => screen.queryByRole('complementary', { name: 'Assignment detail' })
export const getDetail = () => screen.getByRole('complementary', { name: 'Assignment detail' })

/** "N of M done" with N and M not embedded in larger numbers. */
export const workText = (done: number, total: number) =>
  new RegExp(`(^|\\D)${done} of ${total} done`)

/** "N% of the term" with N not embedded in a larger number. */
export const termText = (pct: number) => new RegExp(`(^|\\D)${pct}% of the term`)
