import type { CourseId, Kind, SourceType } from '../types.ts'

export const COURSE_LABEL: Record<CourseId, string> = {
  customer: 'Customer',
  competitor: 'Competitor',
  investor: 'Investor',
  state_society: 'State & Society',
}

export const KIND_LABEL: Record<Kind, string> = {
  homework: 'Homework',
  case_writeup: 'Case write-up',
  memo: 'Memo',
  exam: 'Exam',
  debate: 'Debate',
  fieldwork: 'Fieldwork',
  prep: 'Prep',
  admin: 'Admin',
}

export const SOURCE_LABEL: Record<SourceType, string> = {
  canvas_assignment: 'Canvas assignment',
  syllabus: 'Syllabus',
  announcement: 'Announcement',
  lecture: 'Lecture',
  reading: 'Reading',
  calendar: 'Calendar',
}

export function workLabel(work: 'individual' | 'group'): 'Group' | 'Individual' {
  return work === 'group' ? 'Group' : 'Individual'
}
