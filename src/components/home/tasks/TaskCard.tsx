// src/components/home/tasks/TaskCard.tsx
import { useI18n } from '../../../i18n/context'
import { getTaskUrgency, getDaysSince } from '../../../utils/taskUrgency'
import type { Task } from '../../../types/home'
import type { Member } from '../../../types'
import './TaskCard.css'

interface Props {
    task: Task
    members: Member[]
    currentMemberId?: string
    onComplete: (task: Task) => void
    onDelete: (task: Task) => void
}

function getAssigneeLabel(task: Task, members: Member[], rotationLabel: string): string {
    if (task.assignedTo === 'rotation') {
        const current = members.find((m) => m.id === task.rotationOrder?.[0])
        return current ? current.name : rotationLabel
    }
    const member = members.find((m) => m.id === task.assignedTo)
    return member?.name ?? '—'
}

function getAssigneeColor(task: Task, members: Member[]): string {
    const id = task.assignedTo === 'rotation' ? task.rotationOrder?.[0] : task.assignedTo
    return members.find((m) => m.id === id)?.color ?? '#94a3b8'
}

export function TaskCard({ task, members, onComplete, onDelete }: Props) {
    const { t } = useI18n()
    const h = t.home
    const urgency = getTaskUrgency(task)
    const daysSince = getDaysSince(task.lastDoneAt)

    const isOneTime = task.intervalDays === 0
    const isDone = isOneTime && !!task.lastDoneAt

    let lastDoneText: string
    if (daysSince === null) {
        lastDoneText = h.neverDone
    } else if (daysSince === 0) {
        lastDoneText = h.lastDoneToday
    } else {
        lastDoneText = h.lastDoneDays(daysSince)
    }

    const assigneeLabel =
        task.assignedTo === 'rotation'
            ? h.currentTurn(getAssigneeLabel(task, members, h.rotation))
            : getAssigneeLabel(task, members, h.rotation)

    const dotColor = getAssigneeColor(task, members)

    return (
        <div className={`tc-card tc-card--${urgency}${isDone ? ' tc-card--done' : ''}`}>
            <div className="tc-bar" />
            <div className="tc-body">
                <div className="tc-top">
                    <span className="tc-title">{task.title}</span>
                    <button
                        className="tc-delete"
                        onClick={() => onDelete(task)}
                        aria-label={h.deleteTask}
                    >
                        ×
                    </button>
                </div>

                <div className="tc-meta">
                    <span className="tc-dot" style={{ background: dotColor }} />
                    <span className="tc-assignee">{assigneeLabel}</span>
                    <span className="tc-sep">·</span>
                    <span className={`tc-urgency tc-urgency--${urgency}`}>
                        {h[`urgency${urgency.charAt(0).toUpperCase() + urgency.slice(1)}` as 'urgencyFresh' | 'urgencyMedium' | 'urgencyDue' | 'urgencyOverdue']}
                    </span>
                </div>

                <div className="tc-bottom">
                    <span className="tc-last">{lastDoneText}</span>
                    {!isDone && (
                        <button
                            className="tc-done-btn"
                            onClick={() => onComplete(task)}
                        >
                            {h.markDone}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
