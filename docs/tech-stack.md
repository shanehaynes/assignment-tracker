# Tech stack

## Summary

| Layer          | Choice                                                                                           | Reason                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front end      | React 19 + Vite + TypeScript (strict)                                                            | Fast dev server, one config every tool reads, typecheck in the gate. Shane's proven stack.                                                            |
| Styling        | Plain CSS with custom properties, no framework                                                   | A small app with a deliberate look; a utility framework would fight the typography-led design. Light and dark via `prefers-color-scheme`.             |
| Data           | `data/assignments.json` + `data/semester.json`, committed                                        | The repo is the source of truth. Reviewable diffs when dates change. Imported at build time, validated by a test.                                     |
| Progress state | `data/progress.json` written through a Vite dev-server middleware, with `localStorage` fallback  | Done-marks must survive cache clears and browser switches. A file in the repo can be inspected and committed. Fallback keeps the static build usable. |
| Unit tests     | Vitest + Testing Library                                                                         | Shares Vite's config. Data-validation test guards the JSON.                                                                                           |
| Lint           | oxlint                                                                                           | Fast enough to sit in the gate.                                                                                                                       |
| Formatting     | Prettier (check only in gate)                                                                    | One style, no debate.                                                                                                                                 |
| Hosting        | Local only: `npm run dev`                                                                        | Mission says no sharing. A static `npm run build` works but loses file-backed progress.                                                               |
| Scraping       | Done out-of-band through the Canvas session in Chrome; a Python refresh script is a roadmap item | No Canvas API token is stored in the repo.                                                                                                            |

## Data model

`data/assignments.json` is an array of items:

```ts
type Assignment = {
  id: string // stable slug, e.g. "customer-case-1-black-decker"
  course: 'customer' | 'competitor' | 'investor' | 'state_society'
  title: string
  kind: 'homework' | 'case_writeup' | 'memo' | 'exam' | 'debate' | 'fieldwork' | 'prep' | 'admin'
  work: 'individual' | 'group'
  group_note?: string // e.g. "small learning team of 4, one submission"
  due_at: string // ISO 8601 with offset, Eastern time
  due_precision: 'datetime' | 'date' | 'approx'
  points?: number | null
  description_html?: string // sanitized Canvas description or syllabus excerpt
  canvas_url?: string // assignment page when one exists; otherwise course page
  canvas_assignment_id?: number
  sources: Array<{
    type: 'canvas_assignment' | 'syllabus' | 'announcement' | 'lecture' | 'reading' | 'calendar'
    ref: string
    quote?: string
  }>
  cohort_scope: 'silver' | 'all'
  notes?: string // conflicts or caveats, e.g. announcement vs Canvas date
}
```

`data/semester.json` holds the term window and milestones:

```ts
type Semester = {
  label: string // "Fall-2 2026 through Spring-1 2027"
  start: string // first Fall-2 class, 2026-10-26
  end: string // first day of spring break 2027
  cohort: 'silver'
  milestones: Array<{ date: string; label: string }> // Thanksgiving break, finals, Spring-1 start
  motto?: string // one optional line shown under the progress strip
}
```

`data/progress.json` is `{ [assignmentId]: { done: true, at: ISO } }`.

## Key dependencies

- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`, `typescript`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- `oxlint`, `prettier`
- `dompurify` for rendering Canvas description HTML safely

No router (single view with a detail panel), no state library (React state + one context), no date library (Intl APIs with an explicit `America/New_York` time zone).

## Gate

```bash
npm run check   # tsc -b && vitest run && oxlint && prettier --check .
```

Parallel-safe: no fixed port (the dev port comes from `dev/port.mjs`), no database, no global paths.

## Rejected options

- **Supabase / any backend**: nothing to share, nothing to authenticate. A file is enough.
- **Python + FastAPI server**: would add a second toolchain for the UI; the Python surface stays in the future refresh script.
- **Tailwind**: good for speed, poor for a bespoke understated look at this size.
- **localStorage as the only store**: lost on cache clear; not inspectable; not committable.
