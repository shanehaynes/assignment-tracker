# Roadmap

Phases are ordered. A phase is done when its exit criteria hold and the gate is green.

## Phase 0: Discovery and extraction (done 2026-11-02)

- Identify the four Fall-2 course sites on Canvas and Shane's section in each.
- Pull assignments, announcements, syllabus bodies, files, and calendar events through the signed-in Canvas session.
- Read syllabi, lecture decks, and reading packets; extract every deliverable; resolve cohort variants to Silver; verify each item against its sources.
- Exit: `data/assignments.json` with provenance for every item; a written list of anything uncertain.
- Result: 31 items. Each was extracted by two independent lenses (plus vision readers for image-only decks), reconciled per course, and checked by two skeptical verifiers; a completeness critic ran per course. Open questions live in each item's `notes` and in STATUS.md.

## Phase 1: Tracker MVP (in progress 2026-11-02)

- Block list of deliverables ordered by due date, grouped by day.
- Filters: course (multi-select), date window (today, this week, next two weeks, all, past due), kind, hide-done.
- Each block: due date and time, course, title, individual or group, points, done toggle.
- Detail panel on click: description, sources, notes, link to Canvas.
- Progress strip: calendar position between first class and spring break next to work completed; milestones marked; optional motto.
- Progress persists to `data/progress.json` through the dev server; falls back to `localStorage`.
- Gate: typecheck, data-validation test, component tests, lint, format check. CI runs it.
- Exit: Shane can open `npm run dev`, see every item, check one off, restart, and see it still checked.

## Phase 2: Refresh script

- `scripts/refresh.py`: given a Canvas API token in the environment, re-pull Canvas-native assignments and submission state for the configured courses; emit a diff against `data/assignments.json` (new, changed date, removed) rather than overwriting curated fields.
- Mark items done automatically when Canvas shows a submission.
- Exit: running the script after an instructor edits a due date produces a reviewable diff.

## Phase 3: Spring-1 courses

- Add the Spring-1 core courses when their Canvas sites open (January 2027), repeating the Phase 0 extraction.
- Extend `semester.json` milestones.
- Exit: the tracker covers everything due before spring break.

## Phase 4: Conveniences (only if they earn their place)

- ICS export so deadlines appear in Apple Calendar.
- Week view.
- Keyboard shortcuts for done and navigation.
- Per-course weighting in the progress strip (points instead of counts).

## Non-goals

- Grades, submissions, or any write to Canvas.
- Multi-user support or hosting.
- A general-purpose Canvas client.
