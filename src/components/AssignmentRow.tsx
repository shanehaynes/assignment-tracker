import type { ChangeEvent } from 'react'
import type { Assignment } from '../types.ts'
import { formatDue, formatDueClock } from '../lib/dates.ts'
import { COURSE_LABEL, KIND_LABEL, workLabel } from '../lib/labels.ts'

type Props = {
  assignment: Assignment
  done: boolean
  overdue: boolean
  selected: boolean
  detailId: string
  onOpen: (id: string) => void
  onToggle: (id: string, done: boolean, hadFocus: boolean) => void
}

export default function AssignmentRow({
  assignment: a,
  done,
  overdue,
  selected,
  detailId,
  onOpen,
  onToggle,
}: Props) {
  const clock = formatDueClock(a)
  const className = ['row', done && 'is-done', overdue && 'is-overdue', selected && 'is-selected']
    .filter(Boolean)
    .join(' ')
  const change = (e: ChangeEvent<HTMLInputElement>) =>
    onToggle(a.id, e.currentTarget.checked, document.activeElement === e.currentTarget)

  return (
    <li data-assignment-id={a.id} data-course={a.course} className={className}>
      <div className="row-when">
        <time dateTime={a.due_at} className="sr-only">
          {formatDue(a)}
        </time>
        <span
          className="row-clock"
          aria-hidden="true"
          data-clock={clock}
          data-approx={a.due_precision === 'approx' ? 'approx.' : undefined}
        />
        {overdue ? <span className="overdue">Overdue</span> : null}
      </div>
      <p className="row-course">
        <span className="tint-dot" aria-hidden="true" />
        <span className="row-course-name">{COURSE_LABEL[a.course]}</span>
        <span className="row-kind">{KIND_LABEL[a.kind]}</span>
      </p>
      <div className="row-title-cell">
        <button
          type="button"
          className="row-title"
          aria-expanded={selected}
          aria-controls={selected ? detailId : undefined}
          onClick={() => onOpen(a.id)}
        >
          {a.title}
        </button>
      </div>
      <div className="row-meta">
        <span className={`pill pill-${a.work}`}>{workLabel(a.work)}</span>
        {a.points != null && a.points > 0 ? <span className="points">{a.points} pts</span> : null}
      </div>
      <label className="row-done">
        <input
          type="checkbox"
          className="box"
          aria-label={`Done: ${a.title}`}
          checked={done}
          onChange={change}
        />
      </label>
    </li>
  )
}
