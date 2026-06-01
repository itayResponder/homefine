// src/components/home/tasks/KanbanColumn.tsx
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
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
    onEdit: (task: Task) => void
}

export function TaskGroup({ status, label, emptyText, tasks, members, onDelete, onEdit }: Props) {
    const { setNodeRef } = useDroppable({ id: status })
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className={`tg-group tg-group--${status}`}>
            <div className="tg-header" onClick={() => setCollapsed((c) => !c)}>
                <span className={`tg-arrow${collapsed ? '' : ' tg-arrow--open'}`}>›</span>
                <span className="tg-label">{label}</span>
                <span className="tg-count">{tasks.length}</span>
            </div>

            {!collapsed && (
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="tg-body" ref={setNodeRef}>
                        {tasks.length === 0 ? (
                            <div className="tg-empty">{emptyText}</div>
                        ) : (
                            tasks.map((task) => (
                                <KanbanCard
                                    key={task.id}
                                    task={task}
                                    members={members}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            )}
        </div>
    )
}
