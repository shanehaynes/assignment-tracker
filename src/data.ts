import assignmentsJson from '../data/assignments.json'
import semesterJson from '../data/semester.json'
import type { Assignment, Semester } from './types.ts'

export const ASSIGNMENTS = assignmentsJson as Assignment[]
export const SEMESTER = semesterJson as Semester
