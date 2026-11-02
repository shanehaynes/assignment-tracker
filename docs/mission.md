# Mission

## What this is

A single-page tracker of every deliverable Shane owes in his current Yale SOM quarter, pulled from Canvas and from the places Canvas hides things (syllabi, announcements, lecture decks). It exists so that nothing is forgotten and so that the term's progress is visible at a glance.

## Who it is for

One user: Shane Haynes, Yale SOM MBA Class of 2028, Silver cohort. Locally hosted, no accounts, no sharing.

## The problem

Fall-2 core courses (Customer, Competitor, Investor, State & Society) each publish deliverables differently:

- Canvas Assignments tab, sometimes with section-specific variants (State & Society posts five copies of each memo, one per cohort time slot).
- Syllabus PDFs that hold the authoritative schedule and the individual-vs-group rules.
- Announcements that restate or correct due dates (Investor says Homework 1 is due 11/11; Canvas says 11/12 04:59 UTC, which is the same moment in Eastern time).
- Lecture decks and reading packets with "prepare before class" questions.
- Administrative deadlines (join a homework group by 11/4) that never appear as assignments.

Canvas's own to-do list shows all five cohort variants, hides syllabus-only items, and offers no sense of where the term stands.

## What done looks like

1. Every deliverable for the Silver cohort in the four courses is listed once, with the correct due moment in Eastern time, its course, and whether it is individual or group work.
2. Items from other cohorts are excluded, not merely de-emphasized.
3. The list filters by course and by date window, and a done item can be checked off and stays checked across restarts.
4. Clicking an item shows its description and provenance (which Canvas assignment, which syllabus page, which announcement) and links to the Canvas page.
5. A progress strip at the top shows the term's position between the quarter's first class and spring break, alongside the share of work completed, so effort and calendar can be compared honestly.
6. The repository is the source of truth: the data file is committed, reviewable, and regenerable.

## Principles

- **Usability first.** Fewer clicks, keyboard reachable, legible at a glance. Nothing decorative that does not carry information.
- **Honest signals.** Time elapsed and work completed are shown side by side; neither is dressed up.
- **Provenance over trust.** Every item records where it came from, so a wrong date can be traced and fixed at the source.
- **Understated.** Typography and spacing do the work. One accent color, used sparingly, for urgency.

## Out of scope (for now)

- Courses outside the four Fall-2 core courses (the MBA Class of 2028 site, Venture Development Program).
- Other cohorts' dates.
- Submitting work, grades, or two-way sync with Canvas.
- Multi-user or hosted deployment.
