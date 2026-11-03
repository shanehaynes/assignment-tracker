# UI contract

The accessible names and test hooks below are the interface between the implementation (`src/`) and the acceptance tests (`tests/acceptance/`). The implementer must use them exactly; the verifier writes tests against them without reading the implementation. Anything not named here is the implementer's call.

## Entry point and injection

`src/App.tsx` default-exports `App(props)`. Every prop is optional and defaults to real data:

| Prop          | Type            | Default                                                                        |
| ------------- | --------------- | ------------------------------------------------------------------------------ |
| `assignments` | `Assignment[]`  | `data/assignments.json`                                                        |
| `semester`    | `Semester`      | `data/semester.json`                                                           |
| `now`         | `Date`          | `new Date()` at render; every "today", window and progress computation uses it |
| `store`       | `ProgressStore` | `createServerStore()`                                                          |
| `quotes`      | `Quote[]`       | `data/quotes.json`                                                             |

`src/progress.ts` exports:

```ts
export type ProgressStore = { load(): Promise<Progress>; save(p: Progress): Promise<void> }
export function createServerStore(): ProgressStore // GET/PUT /__progress; falls back to localStorage key "assignment-tracker:progress" when the endpoint fails
export function createMemoryStore(initial?: Progress): ProgressStore
```

`App` calls `store.load()` once on mount and `store.save(next)` after every toggle, with the full `Progress` object.

Types come from `src/types.ts` and must not be changed by either lane.

## Landmarks and names

- `<header>` containing `<h1>Assignments</h1>`.
- `<section aria-label="Progress">`
  - `[data-testid="progress-time"]`: text contains `{n}% of the term`, where n = `floor((now − start) / (end − start) × 100)` clamped to 0–100, with `start` and `end` taken as midnight Eastern on `semester.start` and `semester.end`.
  - `[data-testid="progress-work"]`: text contains `{done} of {total} done`, counting every assignment regardless of filters.
  - `[data-testid="motto"]` when `quotes` is non-empty; absent when `quotes` is empty. It shows the quote of the day: with `n = quotes.length` and `d` = whole days from midnight Eastern on `semester.start` to midnight Eastern on `now`'s date (negative before the start), the quote is `quotes[((d mod n) + n) mod n]`. Inside it, `[data-testid="motto-text"]` contains exactly the quote's `text`, and the element's full text also contains the quote's `author` and `work`, after the text. Re-rendering with a `now` on another Eastern date shows that date's quote; the switch happens at midnight Eastern, like every other "today" computation.
- `<form aria-label="Filters">`
  - One checkbox per course with accessible names `Customer`, `Competitor`, `Investor`, `State & Society`; all checked by default. Unchecking hides that course's items.
  - `<select aria-label="Window">` with option values and labels: `all` "All", `today` "Today", `week` "This week", `fortnight` "Next two weeks", `past` "Past due". Default `all`. Semantics, in Eastern time: `today` = due on today's calendar date; `week` = from midnight today through Sunday 23:59 of the current Monday–Sunday week; `fortnight` = from midnight today through 14 days later 23:59; `past` = due before `now`.
  - `<select aria-label="Kind">` with option values `all` "All kinds" plus each kind: `homework` "Homework", `case_writeup` "Case write-up", `memo` "Memo", `exam` "Exam", `debate` "Debate", `fieldwork` "Fieldwork", `prep` "Prep", `admin` "Admin". Default `all`.
  - Checkbox `Hide done`, checked by default.
- `<section aria-label="Assignments">`: the list, sorted by `due_at` ascending, grouped under day headings (`<h2>`) each with its own `<ol>`. Every item is an `<li data-assignment-id="{id}">` containing:
  - `<time dateTime="{due_at}">` with the formatted due moment in Eastern time (`Tue, Nov 3 · 8:30 AM`; date precision shows no time; approx precision appends `(approx.)`).
  - the course name as text (`Customer`, `Competitor`, `Investor`, `State & Society`).
  - a `<button>` whose accessible name is the assignment title; activating it opens the detail panel.
  - the text `Group` or `Individual`.
  - `<input type="checkbox" aria-label="Done: {title}">`, checked when the item is done.
  - the text `Overdue` when `due_at < now` and the item is not done.
  - When no item matches, the section shows the text `Nothing due`.
- Detail panel, rendered only while an item is selected: `<aside aria-label="Assignment detail">` containing an `<h2>` with the title, the due moment, `[data-testid="description"]` holding the sanitized `description_html`, `<ul aria-label="Sources">` with one `<li>` per source (its `ref` text, and a link when `ref` is a URL), the `notes` text when present, `<a>` with accessible name `Open in Canvas`, `href={canvas_url}`, `target="_blank"`, `rel="noreferrer"`, and a `<button>` named `Close`. Escape closes it.

## Behaviour the tests may assume

- Toggling `Done` immediately updates the list, the work progress text, and calls `store.save`.
- Filters compose (course ∧ window ∧ kind ∧ hide-done).
- All date math uses `America/New_York` via `Intl`, never the host time zone.
- Nothing in the UI depends on network access except the progress endpoint.
