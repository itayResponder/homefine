// src/components/home/tasks/KanbanColumn.tsx
import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './KanbanCard'
import type { Task, TaskStatus } from '../../../types/home'
import type { Member } from '../../../types'

interface Props {
    status: TaskStatus
    label: string
    emptyText: string
    tasks: Task[]
    members: Member[]
    onDelete: (task: Task) => void
}

export function KanbanColumn({ status, label, emptyText, tasks, members, onDelete }: Props) {
    const { setNodeRef, isOver } = useDroppable({ id: status })

    return (
        <div className={`kb-col kb-col--${status}`}>
            <div className="kb-col-header">
                <span className="kb-col-label">{label}</span>
                {tasks.length > 0 && (
                    <span className="kb-col-count">{tasks.length}</span>
                )}
            </div>
            <div
                className={`kb-col-body${isOver ? ' kb-col-body--over' : ''}`}
                ref={setNodeRef}
            >
                {tasks.length === 0 ? (
                    <div className="kb-col-empty">{emptyText}</div>
                ) : (
                    tasks.map((task) => (
                        <KanbanCard
                            key={task.id}
                            task={task}
                            members={members}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
