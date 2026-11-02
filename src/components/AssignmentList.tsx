import type { Ref } from 'react'
import type { Assignment, Progress } from '../types.ts'
import { formatDayHeading } from '../lib/dates.ts'
import { groupByDay, isDone, isOverdue } from '../lib/filters.ts'
import AssignmentRow from './AssignmentRow.tsx'

type Props = {
  items: Assignment[]
  progress: Progress
  now: Date
  todayKey: string
  selectedId: string | null
  detailId: string
  listRef: Ref<HTMLElement>
  onOpen: (id: string) => void
  onToggle: (id: string, done: boolean, hadFocus: boolean) => void
}

export default function AssignmentList({
  items,
  progress,
  now,
  todayKey,
  selectedId,
  detailId,
  listRef,
  onOpen,
  onToggle,
}: Props) {
  const groups = groupByDay(items)
  return (
    <section aria-label="Assignments" className="list" ref={listRef}>
      {groups.length === 0 ? (
        <p className="empty">Nothing due</p>
      ) : (
        groups.map((g) => (
          <div key={g.key} className={g.key === todayKey ? 'day is-today' : 'day'}>
            <h2 className="day-heading">{formatDayHeading(g.key, todayKey)}</h2>
            <ol className="day-items">
              {g.items.map((a) => (
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  done={isDone(progress, a.id)}
                  overdue={isOverdue(a, progress, now)}
                  selected={a.id === selectedId}
                  detailId={detailId}
                  onOpen={onOpen}
                  onToggle={onToggle}
                />
              ))}
            </ol>
          </div>
        ))
      )}
    </section>
  )
}
