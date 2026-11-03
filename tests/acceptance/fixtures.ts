// Acceptance fixtures, written from docs/ui-contract.md and docs/mission.md only.
// Every expected value in the tests is derived by hand from these fixtures and the contract.
// No title, group_note or note contains "Group", "Individual", "Overdue" or a course label, so a
// substring check on a list item's text is unambiguous (tracker.test.tsx asserts this).

import { vi, type Mock } from 'vitest'
import type { Assignment, CourseId, Kind, Progress, Semester } from '../../src/types.ts'

// The contract's injection surface, declared here so the tests do not depend on src/progress.ts.
export type ProgressStore = { load(): Promise<Progress>; save(p: Progress): Promise<void> }

export type TrackerProps = {
  assignments?: Assignment[]
  semester?: Semester
  now?: Date
  store?: ProgressStore
}

// Monday, Nov 2 2026, noon Eastern. DST ended Sunday Nov 1, so Eastern is UTC-5 (EST).
// The current Monday-Sunday week is Mon Nov 2 .. Sun Nov 8.
// The two-week window runs from Mon Nov 2 00:00 through Mon Nov 16 23:59 (today + 14 days).
export const NOW = new Date('2026-11-02T12:00:00-05:00')

export const COURSE_LABEL: Record<CourseId, string> = {
  customer: 'Customer',
  competitor: 'Competitor',
  investor: 'Investor',
  state_society: 'State & Society',
}

export const WINDOW_OPTIONS: Array<[value: string, label: string]> = [
  ['all', 'All'],
  ['today', 'Today'],
  ['week', 'This week'],
  ['fortnight', 'Next two weeks'],
  ['past', 'Past due'],
]

export const KIND_OPTIONS: Array<[value: 'all' | Kind, label: string]> = [
  ['all', 'All kinds'],
  ['homework', 'Homework'],
  ['case_writeup', 'Case write-up'],
  ['memo', 'Memo'],
  ['exam', 'Exam'],
  ['debate', 'Debate'],
  ['fieldwork', 'Fieldwork'],
  ['prep', 'Prep'],
  ['admin', 'Admin'],
]

export const semester: Semester = {
  label: 'Fall-2 2026 through Spring-1 2027 (fixture)',
  cohort: 'silver',
  timezone: 'America/New_York',
  start: '2026-10-26',
  end: '2027-03-08',
  end_label: 'Spring break',
  milestones: [
    { date: '2026-11-23', end: '2026-11-27', label: 'November recess' },
    { date: '2026-12-15', label: 'Fall-2 classes end' },
    { date: '2027-01-19', label: 'Spring-1 classes begin' },
  ],
}

const canvas = (course: number, assignment: number) =>
  `https://yale.instructure.com/courses/${course}/assignments/${assignment}`

// Sun Nov 1, 8:00 PM: before NOW, not done -> Overdue. Outside today/week/fortnight; inside past.
export const overdue: Assignment = {
  id: 'investor-problem-set-2',
  course: 'investor',
  title: 'Problem Set 2: Bond pricing',
  kind: 'homework',
  work: 'group',
  group_note: 'Homework team of four; one submission per team.',
  due_at: '2026-11-01T20:00:00-05:00',
  due_precision: 'datetime',
  points: 10,
  description_html: '<p>Price the three bonds in the attached sheet.</p>',
  canvas_url: canvas(900003, 700201),
  sources: [{ type: 'canvas_assignment', ref: canvas(900003, 700201) }],
  cohort_scope: 'all',
}

// Sun Nov 1, date precision: before NOW but done in the initial progress -> never Overdue.
export const doneInitially: Assignment = {
  id: 'investor-join-homework-team',
  course: 'investor',
  title: 'Join a homework team on Canvas',
  kind: 'admin',
  work: 'individual',
  due_at: '2026-11-01T23:59:00-05:00',
  due_precision: 'date',
  description_html: '<p>Sign up under People, then Homework Teams.</p>',
  canvas_url: 'https://yale.instructure.com/courses/900003',
  sources: [{ type: 'announcement', ref: 'Week 1 logistics announcement' }],
  cohort_scope: 'all',
}

// Mon Nov 2, 11:59 PM: later today. Inside today/week/fortnight; not past.
export const laterToday: Assignment = {
  id: 'customer-case-2-commitment-contracts',
  course: 'customer',
  title: 'Case Write-Up #2: Commitment contracts',
  kind: 'case_writeup',
  work: 'individual',
  due_at: '2026-11-02T23:59:00-05:00',
  due_precision: 'datetime',
  points: 10,
  description_html: '<p>Two pages, before class.</p>',
  canvas_url: canvas(900001, 700101),
  sources: [{ type: 'canvas_assignment', ref: canvas(900001, 700101) }],
  cohort_scope: 'silver',
}

// Thu Nov 5, 8:30 AM: later this week. Used for the detail panel tests.
export const thisWeek: Assignment = {
  id: 'competitor-session-5-homework',
  course: 'competitor',
  title: 'Session 5 homework: Entry deterrence',
  kind: 'homework',
  work: 'group',
  group_note: 'Small learning team; one submission per team.',
  due_at: '2026-11-05T08:30:00-05:00',
  due_precision: 'datetime',
  points: 5,
  description_html:
    '<p>Answer both questions and show <strong>your work</strong>.</p>' +
    '<script>window.__acceptanceScriptRan = true</script>' +
    '<img src="x" alt="" onerror="window.__acceptanceScriptRan = true">',
  canvas_url: canvas(900002, 700105),
  canvas_assignment_id: 700105,
  sources: [
    { type: 'canvas_assignment', ref: canvas(900002, 700105) },
    {
      type: 'announcement',
      ref: 'https://yale.instructure.com/courses/900002/discussion_topics/800011',
    },
    { type: 'syllabus', ref: 'Session 5 problem set, syllabus page 4' },
  ],
  cohort_scope: 'silver',
  notes: 'Canvas closes submissions at 8:30 AM; the syllabus says before your section.',
}

// Sun Nov 8, date precision (23:59): the last day of this Monday-Sunday week.
export const weekEdgeDateOnly: Assignment = {
  id: 'state-society-memo-2',
  course: 'state_society',
  title: 'Memo 2: Regulatory capture',
  kind: 'memo',
  work: 'individual',
  due_at: '2026-11-08T23:59:00-05:00',
  due_precision: 'date',
  points: 20,
  description_html: '<p>One page, 650 words at most.</p>',
  canvas_url: canvas(900004, 700301),
  sources: [{ type: 'canvas_assignment', ref: canvas(900004, 700301) }],
  cohort_scope: 'silver',
}

// Mon Nov 9, 8:30 AM: next week. Outside "This week" even though it is within 7 days of NOW.
export const nextWeek: Assignment = {
  id: 'customer-session-7-prep',
  course: 'customer',
  title: 'Prepare session 7 discussion questions',
  kind: 'prep',
  work: 'individual',
  due_at: '2026-11-09T08:30:00-05:00',
  due_precision: 'datetime',
  description_html: '<p>Read the case and prepare questions 1 to 3.</p>',
  canvas_url: 'https://yale.instructure.com/courses/900001',
  sources: [{ type: 'lecture', ref: 'Session 6 slides, final page' }],
  cohort_scope: 'silver',
}

// Mon Nov 16, 11:59 PM: exactly the last minute of the two-week window (today + 14 days, 23:59).
export const fortnightEdge: Assignment = {
  id: 'investor-problem-set-3',
  course: 'investor',
  title: 'Problem Set 3: Portfolio choice',
  kind: 'homework',
  work: 'group',
  group_note: 'Homework team of four; one submission per team.',
  due_at: '2026-11-16T23:59:00-05:00',
  due_precision: 'datetime',
  points: 10,
  description_html: '<p>Use the returns data posted with the problem set.</p>',
  canvas_url: canvas(900003, 700202),
  sources: [{ type: 'canvas_assignment', ref: canvas(900003, 700202) }],
  cohort_scope: 'all',
}

// Tue Nov 17, 8:30 AM: just past the two-week window.
export const pastFortnight: Assignment = {
  id: 'customer-case-4-streaming',
  course: 'customer',
  title: 'Case Write-Up #4: Streaming wars',
  kind: 'case_writeup',
  work: 'individual',
  due_at: '2026-11-17T08:30:00-05:00',
  due_precision: 'datetime',
  points: 10,
  description_html: '<p>Two pages, before class.</p>',
  canvas_url: canvas(900001, 700104),
  sources: [{ type: 'canvas_assignment', ref: canvas(900001, 700104) }],
  cohort_scope: 'silver',
}

// Thu Dec 17, 9:00 AM: December.
export const december: Assignment = {
  id: 'competitor-final-exam',
  course: 'competitor',
  title: 'Final exam',
  kind: 'exam',
  work: 'individual',
  due_at: '2026-12-17T09:00:00-05:00',
  due_precision: 'datetime',
  points: 40,
  description_html: '<p>Closed book, in person.</p>',
  canvas_url: 'https://yale.instructure.com/courses/900002',
  sources: [{ type: 'syllabus', ref: 'Competitor syllabus, assessment section' }],
  cohort_scope: 'all',
}

// Wed Mar 3 2027, approx precision: early March (EST; DST starts Mar 14 2027).
export const marchApprox: Assignment = {
  id: 'state-society-final-debate',
  course: 'state_society',
  title: 'Final debate: Carbon pricing',
  kind: 'debate',
  work: 'group',
  group_note: 'Debate team assigned in week 6.',
  due_at: '2027-03-03T10:05:00-05:00',
  due_precision: 'approx',
  description_html: '<p>Date to be confirmed by the instructor.</p>',
  canvas_url: 'https://yale.instructure.com/courses/900004',
  sources: [{ type: 'syllabus', ref: 'State and Society syllabus, debate schedule' }],
  cohort_scope: 'silver',
  notes: 'The syllabus gives the week, not the day.',
}

// Deliberately not in due order, so the tests prove the UI sorts.
export const assignments: Assignment[] = [
  december,
  laterToday,
  marchApprox,
  doneInitially,
  fortnightEdge,
  overdue,
  weekEdgeDateOnly,
  pastFortnight,
  thisWeek,
  nextWeek,
]

export const initialProgress: Progress = {
  [doneInitially.id]: { done: true, at: '2026-11-01T21:00:00-05:00' },
}

export const ids = (...items: Assignment[]) => items.map((a) => a.id)

export type TestStore = ProgressStore & {
  load: Mock<() => Promise<Progress>>
  save: Mock<(p: Progress) => Promise<void>>
  /** What a restart would load. */
  snapshot(): Progress
}

export function createTestStore(initial: Progress = initialProgress): TestStore {
  let state: Progress = structuredClone(initial)
  const load = vi.fn(async (): Promise<Progress> => structuredClone(state))
  const save = vi.fn(async (p: Progress): Promise<void> => {
    state = structuredClone(p)
  })
  return { load, save, snapshot: () => structuredClone(state) }
}
