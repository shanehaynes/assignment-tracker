import { COURSES, KINDS, type CourseId } from '../types.ts'
import { COURSE_LABEL, KIND_LABEL } from '../lib/labels.ts'
import {
  WINDOWS,
  WINDOW_LABEL,
  isDefaultFilters,
  type FilterState,
  type KindFilter,
  type WindowKey,
} from '../lib/filters.ts'

type Props = {
  value: FilterState
  onChange: (next: FilterState) => void
  onReset: () => void
  shown: number
  total: number
}

export default function Filters({ value, onChange, onReset, shown, total }: Props) {
  const setCourse = (course: CourseId, on: boolean) =>
    onChange({ ...value, courses: { ...value.courses, [course]: on } })

  return (
    <form aria-label="Filters" className="filters" onSubmit={(e) => e.preventDefault()}>
      <fieldset className="chips">
        <legend className="sr-only">Courses</legend>
        {COURSES.map((course) => (
          <label key={course} className="chip" data-course={course}>
            <input
              type="checkbox"
              className="chip-input"
              checked={value.courses[course]}
              onChange={(e) => setCourse(course, e.currentTarget.checked)}
            />
            <span className="chip-face">
              <span className="tint-dot" aria-hidden="true" />
              {COURSE_LABEL[course]}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="filter-row">
        <label className="field">
          <span className="field-label">Window</span>
          <span className="select">
            <select
              aria-label="Window"
              value={value.window}
              onChange={(e) => onChange({ ...value, window: e.currentTarget.value as WindowKey })}
            >
              {WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {WINDOW_LABEL[w]}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="field">
          <span className="field-label">Kind</span>
          <span className="select">
            <select
              aria-label="Kind"
              value={value.kind}
              onChange={(e) => onChange({ ...value, kind: e.currentTarget.value as KindFilter })}
            >
              <option value="all">All kinds</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            className="box"
            checked={value.hideDone}
            onChange={(e) => onChange({ ...value, hideDone: e.currentTarget.checked })}
          />
          Hide done
        </label>

        {isDefaultFilters(value) ? null : (
          <button
            type="button"
            className="text-button"
            onClick={(e) => {
              // This button unmounts once the filters are back to default; keep focus in the form.
              e.currentTarget.form?.querySelector<HTMLInputElement>('input')?.focus()
              onReset()
            }}
          >
            Reset filters
          </button>
        )}

        <output className="count" aria-live="polite">
          Showing {shown} of {total}
        </output>
      </div>
    </form>
  )
}
