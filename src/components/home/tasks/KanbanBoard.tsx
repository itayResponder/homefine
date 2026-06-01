// src/components/home/tasks/KanbanBoard.tsx
import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { useI18n } from '../../../i18n/context'
import type { Task, TaskStatus } from '../../../types/home'
import type { Member } from '../../../types'
import './KanbanBoard.css'

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done']

export function inferTaskStatus(task: Task): TaskStatus {
    if (task.status) return task.status
    // backward compat: one-time task that has been completed
    if (task.intervalDays === 0 && task.lastDoneAt) return 'done'
    return 'todo'
}

interface Props {
    tasks: Task[]
    members: Member[]
    onMoveStatus: (task: Task, status: TaskStatus) => void
    onDelete: (task: Task) => void
    onAddClick: () => void
}

export function KanbanBoard({ tasks, members, onMoveStatus, onDelete, onAddClick }: Props) {
    const { t } = useI18n()
    const h = t.home

    const [activeTask, setActiveTask] = useState<Task | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    )

    const handleDragStart = ({ active }: DragStartEvent) => {
        const task = tasks.find((tk) => tk.id === active.id)
        setActiveTask(task ?? null)
    }

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveTask(null)
        if (!over) return
        const task = tasks.find((tk) => tk.id === active.id)
        if (!task) return
        const newStatus = over.id as TaskStatus
        if (newStatus !== inferTaskStatus(task)) {
            onMoveStatus(task, newStatus)
        }
    }

    const columnLabel = (status: TaskStatus): string => ({
        'todo': h.kanbanTodo,
        'in-progress': h.kanbanInProgress,
        'done': h.kanbanDone,
    }[status])

    return (
        <div className="kb-root">
            <div className="kb-toolbar">
                <button className="sbtn kb-add-btn" onClick={onAddClick}>
                    {h.addTaskBtn}
                </button>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="kb-board">
                    {COLUMNS.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            label={columnLabel(status)}
                            emptyText={h.noTasksInColumn}
                            tasks={tasks.filter((tk) => inferTaskStatus(tk) === status)}
                            members={members}
                            onDelete={onDelete}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeTask && (
                        <KanbanCard
                            task={activeTask}
                            members={members}
                            onDelete={() => {}}
                            isDragOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
