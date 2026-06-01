// src/components/home/tasks/EditTaskModal.tsx
import React, { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { ROOM_ORDER, ROOM_DEFS } from '../../../constants/rooms'
import { INTERVALS } from '../../../constants/tasks'
import { CustomSelect } from '../../ui/CustomSelect'
import { CustomDatePicker } from '../../ui/CustomDatePicker'
import type { Task, TaskRoom, TaskStatus } from '../../../types/home'
import type { Member } from '../../../types'
import './AddTaskModal.css'

interface Props {
    task: Task
    members: Member[]
    onSave: (updates: Partial<Omit<Task, 'id'>>) => void
    onClose: () => void
}

export function EditTaskModal({ task, members, onSave, onClose }: Props) {
    const { t } = useI18n()
    const h = t.home

    const [title, setTitle]               = useState(task.title)
    const [room, setRoom]                 = useState<TaskRoom>(task.room)
    const [assignedTo, setAssignedTo]     = useState(task.assignedTo)
    const [intervalDays, setIntervalDays] = useState(task.intervalDays)
    const [dueDate, setDueDate]           = useState(task.dueDate ?? '')
    const [estimatedDays, setEstimatedDays] = useState(
        task.estimatedDays != null ? String(task.estimatedDays) : '',
    )
    const [status, setStatus]             = useState<TaskStatus>(task.status ?? 'todo')

    const roomOptions = ROOM_ORDER.map((r) => ({
        value: r,
        label: `${ROOM_DEFS[r].icon} ${h[`room${r.charAt(0).toUpperCase() + r.slice(1)}` as 'roomBathroom']}`,
    }))

    const assignOptions = [
        ...members.map((m) => ({ value: m.id, label: m.name })),
        { value: 'rotation', label: `🔄 ${h.rotation}` },
    ]

    const intervalOptions = INTERVALS.map(({ days, key }) => ({
        value: String(days),
        label: h[key] as string,
    }))

    const statusOptions: { value: TaskStatus; label: string }[] = [
        { value: 'todo',        label: h.kanbanTodo },
        { value: 'in-progress', label: h.kanbanInProgress },
        { value: 'done',        label: h.kanbanDone },
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        const updates: Partial<Omit<Task, 'id'>> = {
            title: title.trim(),
            room,
            assignedTo,
            intervalDays,
            status,
            ...(dueDate ? { dueDate } : { dueDate: undefined }),
            ...(estimatedDays && !isNaN(Number(estimatedDays))
                ? { estimatedDays: Number(estimatedDays) }
                : { estimatedDays: undefined }),
        }

        // Handle rotation order when switching assignedTo
        if (assignedTo === 'rotation' && task.assignedTo !== 'rotation') {
            updates.rotationOrder = members.map((m) => m.id)
        } else if (assignedTo !== 'rotation') {
            updates.rotationOrder = undefined
        }

        // Set startedAt when moving to in-progress for the first time
        if (status === 'in-progress' && !task.startedAt) {
            updates.startedAt = Date.now()
        }
        // Set lastDoneAt when moving to done
        if (status === 'done' && task.status !== 'done') {
            updates.lastDoneAt = Date.now()
        }

        onSave(updates)
    }

    return (
        <div className="ap-modal-overlay atm-overlay" onClick={onClose}>
            <div className="ap-modal atm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <span>{h.editTaskTitle}</span>
                    <button className="ap-modal-close" onClick={onClose}>×</button>
                </div>

                <form className="atm-form" onSubmit={handleSubmit}>
                    {/* Title */}
                    <label className="atm-label">
                        <span>{h.taskTitleLabel}</span>
                        <input
                            className="inp"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={h.taskTitlePlaceholder}
                            autoFocus
                            required
                        />
                    </label>

                    {/* Status */}
                    <label className="atm-label">
                        <span>{h.statusLabel}</span>
                        <CustomSelect
                            options={statusOptions}
                            value={status}
                            onChange={(v) => setStatus(v as TaskStatus)}
                        />
                    </label>

                    {/* Room */}
                    <label className="atm-label">
                        <span>{h.roomLabel}</span>
                        <CustomSelect
                            options={roomOptions}
                            value={room}
                            onChange={(v) => setRoom(v as TaskRoom)}
                        />
                    </label>

                    {/* Assigned to */}
                    <label className="atm-label">
                        <span>{h.assignLabel}</span>
                        <CustomSelect
                            options={assignOptions}
                            value={assignedTo}
                            onChange={setAssignedTo}
                        />
                    </label>

                    {/* Frequency */}
                    <label className="atm-label">
                        <span>{h.intervalLabel}</span>
                        <CustomSelect
                            options={intervalOptions}
                            value={String(intervalDays)}
                            onChange={(v) => setIntervalDays(Number(v))}
                        />
                    </label>

                    {/* Due date */}
                    <label className="atm-label">
                        <span>{h.dueDateLabel}</span>
                        <CustomDatePicker
                            value={dueDate}
                            onChange={setDueDate}
                            placeholder={h.dueDateLabel}
                            openUp
                        />
                    </label>

                    {/* Estimated days */}
                    <label className="atm-label">
                        <span>{h.estimatedDaysLabel}</span>
                        <input
                            className="inp"
                            type="number"
                            min="1"
                            max="365"
                            value={estimatedDays}
                            onChange={(e) => setEstimatedDays(e.target.value)}
                            placeholder={h.estimatedDaysPlaceholder}
                        />
                    </label>

                    <div className="atm-footer">
                        <button type="button" className="sbtn sbtn--ghost" onClick={onClose}>
                            {t.cancel}
                        </button>
                        <button type="submit" className="sbtn" disabled={!title.trim()}>
                            {t.saveChanges}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
