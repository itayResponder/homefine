// src/components/home/tasks/KanbanBoard.tsx
import { useRef, useState, useEffect } from 'react'
import {
    DndContext, DragOverlay,
    PointerSensor, TouchSensor,
    useSensor, useSensors,
    closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { TaskGroup } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { useI18n } from '../../../i18n/context'
import type { Task, TaskStatus } from '../../../types/home'
import type { Member } from '../../../types'
import './KanbanBoard.css'

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']

export function inferTaskStatus(task: Task): TaskStatus {
    if (task.status) return task.status
    // backward compat: one-time task that has been completed
    if (task.intervalDays === 0 && task.lastDoneAt) return 'done'
    return 'todo'
}

function sortByOrder(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
}

interface Props {
    tasks: Task[]
    members: Member[]
    onMoveStatus: (task: Task, status: TaskStatus) => void
    onReorder: (updates: { id: string; order: number }[]) => void
    onDelete: (task: Task) => void
    onAddClick: () => void
}

export function KanbanBoard({ tasks, members, onMoveStatus, onReorder, onDelete, onAddClick }: Props) {
    const { t } = useI18n()
    const h = t.home

    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [localTasks, setLocalTasks] = useState<Task[]>([])
    const dragActive = useRef(false)

    // Sync from Firebase only when not dragging
    useEffect(() => {
        if (!dragActive.current) {
            setLocalTasks(sortByOrder(tasks))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    )

    // Returns the TaskStatus for a given ID (either a status string or a task ID)
    const getStatusOf = (id: string): TaskStatus | null => {
        if (STATUSES.includes(id as TaskStatus)) return id as TaskStatus
        const task = localTasks.find((t) => t.id === id)
        return task ? inferTaskStatus(task) : null
    }

    const handleDragStart = ({ active }: DragStartEvent) => {
        dragActive.current = true
        const task = localTasks.find((t) => t.id === active.id)
        setActiveTask(task ?? null)
    }

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        if (!over) return
        const activeId = active.id as string
        const overId = over.id as string

        const activeStatus = getStatusOf(activeId)
        const overStatus = getStatusOf(overId)

        if (!activeStatus || !overStatus || activeStatus === overStatus) return

        // Move task to new group in local state (visual only until dragEnd)
        setLocalTasks((prev) =>
            prev.map((t) => (t.id === activeId ? { ...t, status: overStatus } : t)),
        )
    }

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        dragActive.current = false
        const draggedTask = activeTask
        setActiveTask(null)

        if (!over || !draggedTask) {
            // Cancelled — revert
            setLocalTasks(sortByOrder(tasks))
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        const currentTask = localTasks.find((t) => t.id === activeId)
        const currentStatus = currentTask ? inferTaskStatus(currentTask) : inferTaskStatus(draggedTask)
        const originalStatus = inferTaskStatus(draggedTask)

        // Inter-group: status changed during onDragOver
        if (currentStatus !== originalStatus) {
            onMoveStatus(draggedTask, currentStatus)
            return
        }

        // Intra-group: check if position changed
        const groupTasks = localTasks.filter((t) => inferTaskStatus(t) === currentStatus)
        const oldIdx = groupTasks.findIndex((t) => t.id === activeId)
        const newIdx = groupTasks.findIndex((t) => t.id === overId)

        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            const reordered = arrayMove(groupTasks, oldIdx, newIdx)
            const withOrder = reordered.map((task, idx) => ({ ...task, order: idx * 1000 }))
            // Optimistic update
            setLocalTasks((prev) => {
                const others = prev.filter((t) => inferTaskStatus(t) !== currentStatus)
                return sortByOrder([...others, ...withOrder])
            })
            onReorder(withOrder.map((t) => ({ id: t.id, order: t.order! })))
        }
    }

    const groupLabel = (status: TaskStatus): string =>
        ({ todo: h.kanbanTodo, 'in-progress': h.kanbanInProgress, done: h.kanbanDone }[status])

    return (
        <div className="kb-root">
            <div className="kb-toolbar">
                <button className="sbtn kb-add-btn" onClick={onAddClick}>
                    {h.addTaskBtn}
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="kb-groups">
                    {STATUSES.map((status) => (
                        <TaskGroup
                            key={status}
                            status={status}
                            label={groupLabel(status)}
                            emptyText={h.noTasksInColumn}
                            tasks={localTasks.filter((t) => inferTaskStatus(t) === status)}
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
