// Data contract shared by the data files, the validation test, and the UI.
// Changing it is a decision: update docs/tech-stack.md in the same change.

export const COURSES = ['customer', 'competitor', 'investor', 'state_society'] as const
export type CourseId = (typeof COURSES)[number]

export const KINDS = [
  'homework',
  'case_writeup',
  'memo',
  'exam',
  'debate',
  'fieldwork',
  'prep',
  'admin',
] as const
export type Kind = (typeof KINDS)[number]

export const SOURCE_TYPES = [
  'canvas_assignment',
  'syllabus',
  'announcement',
  'lecture',
  'reading',
  'calendar',
] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export type Source = {
  type: SourceType
  /** Where to look: a Canvas URL, a file name plus page, an announcement title. */
  ref: string
  quote?: string
}

export type Assignment = {
  /** Stable slug, e.g. "customer-case-1-black-decker". */
  id: string
  course: CourseId
  title: string
  kind: Kind
  work: 'individual' | 'group'
  group_note?: string
  /** ISO 8601 with offset, Eastern time, e.g. "2026-11-03T08:30:00-05:00". */
  due_at: string
  due_precision: 'datetime' | 'date' | 'approx'
  points?: number | null
  /** Sanitized before render; may be empty. */
  description_html?: string
  canvas_url?: string
  canvas_assignment_id?: number
  sources: Source[]
  cohort_scope: 'silver' | 'all'
  notes?: string
}

export type Milestone = { date: string; end?: string; label: string }

export type Semester = {
  label: string
  cohort: 'silver'
  timezone: 'America/New_York'
  start: string
  end: string
  end_label?: string
  milestones: Milestone[]
  motto?: string
  motto_attribution?: string
  sources?: string[]
}

export type ProgressEntry = { done: true; at: string }
export type Progress = Record<string, ProgressEntry>
