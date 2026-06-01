// src/components/home/tasks/AddTaskModal.tsx
import React, { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { ROOM_ORDER, ROOM_DEFS } from '../../../constants/rooms'
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
        }
        onAdd(task)
        onClose()
    }

    return (
        <div className="ap-modal-overlay" onClick={onClose}>
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
                        <select
                            className="inp atm-select"
                            value={room}
                            onChange={(e) => setRoom(e.target.value as TaskRoom)}
                        >
                            {ROOM_ORDER.map((r) => (
                                <option key={r} value={r}>
                                    {ROOM_DEFS[r].icon} {h[`room${r.charAt(0).toUpperCase() + r.slice(1)}` as 'roomBathroom']}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Assigned to */}
                    <label className="atm-label">
                        <span>{h.assignLabel}</span>
                        <select
                            className="inp atm-select"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                        >
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                            <option value="rotation">🔄 {h.rotation}</option>
                        </select>
                    </label>

                    {/* Frequency */}
                    <label className="atm-label">
                        <span>{h.intervalLabel}</span>
                        <select
                            className="inp atm-select"
                            value={intervalDays}
                            onChange={(e) => setIntervalDays(Number(e.target.value))}
                        >
                            {INTERVALS.map(({ days, key }) => (
                                <option key={days} value={days}>
                                    {h[key] as string}
                                </option>
                            ))}
                        </select>
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
