import assignmentsJson from '../data/assignments.json'
import quotesJson from '../data/quotes.json'
import semesterJson from '../data/semester.json'
import type { Assignment, Quote, Semester } from './types.ts'

export const ASSIGNMENTS = assignmentsJson as Assignment[]
export const SEMESTER = semesterJson as Semester
export const QUOTES = quotesJson as Quote[]
