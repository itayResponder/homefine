// src/components/home/tasks/AddTaskModal.tsx
import React, { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { ROOM_ORDER, ROOM_DEFS } from '../../../constants/rooms'
import { CustomSelect } from '../../ui/CustomSelect'
import { CustomDatePicker } from '../../ui/CustomDatePicker'
import type { Task, TaskRoom } from '../../../types/home'
import type { Member } from '../../../types'
import './AddTaskModal.css'

const INTERVALS: { days: number; key: keyof ReturnType<typeof useI18n>['t']['home'] }[] = [
    { days: 0,  key: 'intervalOnce'   },
    { days: 1,  key: 'intervalDaily'  },
    { days: 2,  key: 'interval2Days'  },
    { days: 7,  key: 'intervalWeekly' },
    { days: 14, key: 'interval2Weeks' },
    { days: 30, key: 'intervalMonthly'},
]

interface Props {
    members: Member[]
    currentMemberId?: string
    onAdd: (task: Omit<Task, 'id'>) => void
    onClose: () => void
}

export function AddTaskModal({ members, currentMemberId, onAdd, onClose }: Props) {
    const { t } = useI18n()
    const h = t.home

    const [title, setTitle] = useState('')
    const [room, setRoom] = useState<TaskRoom>('general')
    const [assignedTo, setAssignedTo] = useState<string>(currentMemberId ?? members[0]?.id ?? 'rotation')
    const [intervalDays, setIntervalDays] = useState(7)
    const [dueDate, setDueDate] = useState('')
    const [estimatedDays, setEstimatedDays] = useState('')

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        const isRotation = assignedTo === 'rotation'
        const task: Omit<Task, 'id'> = {
            title: title.trim(),
            room,
            assignedTo: isRotation ? 'rotation' : assignedTo,
            ...(isRotation ? { rotationOrder: members.map((m) => m.id) } : {}),
            intervalDays,
            createdAt: Date.now(),
            createdBy: currentMemberId ?? members[0]?.id ?? '',
            status: 'todo',
            ...(dueDate ? { dueDate } : {}),
            ...(estimatedDays && !isNaN(Number(estimatedDays)) ? { estimatedDays: Number(estimatedDays) } : {}),
        }
        onAdd(task)
        onClose()
    }

    return (
        <div className="ap-modal-overlay atm-overlay" onClick={onClose}>
            <div className="ap-modal atm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <span>{h.addTaskBtn.replace('+ ', '')}</span>
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
                            {t.add}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
