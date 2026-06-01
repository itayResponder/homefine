// src/components/home/tasks/KanbanCard.tsx
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useI18n } from '../../../i18n/context'
import { getTaskUrgency } from '../../../utils/taskUrgency'
import { ROOM_DEFS } from '../../../constants/rooms'
import type { Task } from '../../../types/home'
import type { Member } from '../../../types'
import './KanbanCard.css'

interface Props {
    task: Task
    members: Member[]
    onDelete: (task: Task) => void
    isDragOverlay?: boolean
}

function getAssigneeInfo(task: Task, members: Member[]) {
    const id = task.assignedTo === 'rotation' ? task.rotationOrder?.[0] : task.assignedTo
    const member = members.find((m) => m.id === id)
    return { name: member?.name ?? '—', color: member?.color ?? '#94a3b8' }
}

function formatDueDate(dueDate: string, h: { dueDateToday: string; dueDateTomorrow: string; dueDateYesterday: string }): string {
    const d = new Date(dueDate + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.floor((d.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return h.dueDateToday
    if (diff === 1) return h.dueDateTomorrow
    if (diff === -1) return h.dueDateYesterday
    return `${d.getDate()}/${d.getMonth() + 1}`
}

export function KanbanCard({ task, members, onDelete, isDragOverlay = false }: Props) {
    const { t } = useI18n()
    const h = t.home

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined

    const urgency = getTaskUrgency(task)
    const { name: assigneeName, color: assigneeColor } = getAssigneeInfo(task, members)
    const roomDef = ROOM_DEFS[task.room]

    const roomKey = `room${task.room.charAt(0).toUpperCase() + task.room.slice(1)}` as keyof typeof h
    const roomLabel = h[roomKey] as string

    // Progress bar (in-progress + estimatedDays)
    const showProgress = task.status === 'in-progress' && !!task.estimatedDays
    let progressPct = 0
    if (showProgress && task.estimatedDays) {
        const startMs = task.startedAt ?? task.createdAt
        const elapsed = Math.floor((Date.now() - startMs) / 86400000)
        progressPct = Math.min(elapsed / task.estimatedDays, 1)
    }

    // Due date
    const dueDateText = task.dueDate ? formatDueDate(task.dueDate, h) : null
    const isDueOverdue = task.dueDate && task.status !== 'done'
        && new Date(task.dueDate + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0))

    const isGhosting = isDragging && !isDragOverlay

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`kc-card kc-card--${urgency}${isGhosting ? ' kc-card--ghost' : ''}${isDragOverlay ? ' kc-card--overlay' : ''}`}
            {...listeners}
            {...attributes}
        >
            <div className="kc-urgency-bar" />
            <div className="kc-body">
                <div className="kc-top">
                    <span className="kc-title">{task.title}</span>
                    <button
                        className="kc-delete"
                        onClick={(e) => { e.stopPropagation(); onDelete(task) }}
                        aria-label={h.deleteTask}
                    >
                        ×
                    </button>
                </div>

                <div className="kc-meta">
                    <span className="kc-room">{roomDef.icon} {roomLabel}</span>
                    <span className="kc-sep">·</span>
                    <span className="kc-dot" style={{ background: assigneeColor }} />
                    <span className="kc-assignee">{assigneeName}</span>
                </div>

                {dueDateText && (
                    <div className={`kc-due${isDueOverdue ? ' kc-due--overdue' : ''}`}>
                        📅 {dueDateText}
                    </div>
                )}

                {showProgress && (
                    <div className="kc-progress">
                        <div
                            className={`kc-progress-fill${progressPct >= 1 ? ' kc-progress-fill--over' : progressPct >= 0.7 ? ' kc-progress-fill--warn' : ''}`}
                            style={{ width: `${Math.round(progressPct * 100)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
