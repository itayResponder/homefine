// src/components/calendar/EventModal.tsx
import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/context'
import { useConfirm } from '../../contexts/ui'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import type { CalendarEvent, Member, RecurringFrequency } from '../../types'

const EVENT_COLORS = [
    '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
    '#EA580C', '#D97706', '#16A34A', '#0891B2',
]

const AVATAR_COLORS = ['#6366F1','#EC4899','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EF4444','#06B6D4']
function nameToColor(name: string): string {
    const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
    return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

interface Props {
    event?: CalendarEvent                          // undefined = create mode
    defaultDate?: string                           // "YYYY-MM-DD" — pre-fill on create
    members: Member[]
    currentUserId: string
    primaryColor: string
    onSave: (data: Omit<CalendarEvent, 'id'>) => Promise<void>
    onDelete?: (eventId: string) => Promise<void>
    onClose: () => void
}

function today(): string {
    return new Date().toISOString().slice(0, 10)
}

export function EventModal({
    event,
    defaultDate,
    members,
    currentUserId,
    primaryColor,
    onSave,
    onDelete,
    onClose,
}: Props) {
    const { t } = useI18n()
    const { showConfirm } = useConfirm()

    const isEdit = !!event

    const [title, setTitle] = useState(event?.title ?? '')
    const [description, setDescription] = useState(event?.description ?? '')
    const [startDate, setStartDate] = useState(event?.startDate ?? defaultDate ?? today())
    const [endDate, setEndDate] = useState(event?.endDate ?? defaultDate ?? today())
    const [allDay, setAllDay] = useState(!event?.startTime)
    const [startTime, setStartTime] = useState(event?.startTime ?? '09:00')
    const [endTime, setEndTime] = useState(event?.endTime ?? '10:00')
    const [color, setColor] = useState(event?.color ?? primaryColor ?? EVENT_COLORS[0])
    const [participants, setParticipants] = useState<string[]>(event?.participants ?? [])
    const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency | ''>(event?.recurring?.frequency ?? '')
    const [recurringUntil, setRecurringUntil] = useState(event?.recurring?.until ?? '')
    const [saving, setSaving] = useState(false)

    // keep endDate >= startDate
    useEffect(() => {
        if (endDate < startDate) setEndDate(startDate)
    }, [startDate])

    const toggleParticipant = (uid: string) => {
        setParticipants((prev) =>
            prev.includes(uid) ? prev.filter((p) => p !== uid) : [...prev, uid],
        )
    }

    const toggleEveryone = () => {
        setParticipants([])
    }

    const handleSave = async () => {
        if (!title.trim()) return
        setSaving(true)
        try {
            const data: Omit<CalendarEvent, 'id'> = {
                title: title.trim(),
                description: description.trim() || undefined,
                startDate,
                endDate,
                startTime: allDay ? undefined : startTime,
                endTime: allDay ? undefined : endTime,
                color,
                createdBy: event?.createdBy ?? currentUserId,
                participants,
                ...(recurringFreq
                    ? { recurring: { frequency: recurringFreq, ...(recurringUntil ? { until: recurringUntil } : {}) } }
                    : {}),
            }
            await onSave(data)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!event || !onDelete) return
        const confirmed = await showConfirm({
            title: t.calendar.confirmDeleteTitle,
            sub: t.calendar.confirmDeleteSub(event.title),
            danger: true,
        })
        if (!confirmed) return
        await onDelete(event.id)
        onClose()
    }

    const everyoneActive = participants.length === 0

    return (
        <div className="cal-modal-overlay" onClick={onClose}>
            <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="cal-modal-header">
                    <span className="cal-modal-title">
                        {isEdit ? t.calendar.editEvent : t.calendar.newEvent}
                    </span>
                    <button className="cal-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                {/* Body */}
                <div className="cal-modal-body">
                    {/* Title */}
                    <div className="cal-field">
                        <label className="cal-label">{t.calendar.titleLabel}</label>
                        <input
                            className="cal-input"
                            placeholder={t.calendar.titlePlaceholder}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="cal-field">
                        <label className="cal-label">{t.calendar.descriptionLabel}</label>
                        <textarea
                            className="cal-input cal-input--textarea"
                            placeholder={t.calendar.descriptionPlaceholder}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Dates */}
                    <div className="cal-date-row">
                        <div className="cal-field">
                            <label className="cal-label">{t.calendar.startDateLabel}</label>
                            <CustomDatePicker value={startDate} onChange={setStartDate} />
                        </div>
                        <div className="cal-field">
                            <label className="cal-label">{t.calendar.endDateLabel}</label>
                            <CustomDatePicker value={endDate} onChange={setEndDate} />
                        </div>
                    </div>

                    {/* All-day toggle */}
                    <div className="cal-allday-row">
                        <input
                            id="cal-allday"
                            type="checkbox"
                            className="cal-allday-check"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                        />
                        <label htmlFor="cal-allday" className="cal-allday-label">
                            {t.calendar.allDay}
                        </label>
                    </div>

                    {/* Time */}
                    {!allDay && (
                        <div className="cal-time-row">
                            <div className="cal-field">
                                <label className="cal-label">{t.calendar.startTimeLabel}</label>
                                <input
                                    type="time"
                                    className="cal-input"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="cal-field">
                                <label className="cal-label">{t.calendar.endTimeLabel}</label>
                                <input
                                    type="time"
                                    className="cal-input"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Color */}
                    <div className="cal-field">
                        <label className="cal-label">{t.calendar.colorLabel}</label>
                        <div className="cal-color-row">
                            {EVENT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    className={`cal-color-swatch${color === c ? ' cal-color-swatch--active' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setColor(c)}
                                    aria-label={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Participants */}
                    {members.length > 0 && (
                        <div className="cal-field">
                            <label className="cal-label">{t.calendar.participants}</label>
                            <div className="cal-participants-wrap">
                                {/* Everyone chip */}
                                <button
                                    className={`cal-participant-chip${everyoneActive ? ' cal-participant-chip--active' : ''}`}
                                    onClick={toggleEveryone}
                                >
                                    🏠 {t.calendar.everyone}
                                </button>

                                {/* Member chips */}
                                {members.map((m) => {
                                    const isActive = participants.includes(m.id)
                                    const bg = nameToColor(m.name)
                                    return (
                                        <button
                                            key={m.id}
                                            className={`cal-participant-chip${isActive ? ' cal-participant-chip--active' : ''}`}
                                            onClick={() => toggleParticipant(m.id)}
                                        >
                                            <span
                                                className="cal-participant-initials"
                                                style={{ background: bg }}
                                            >
                                                {m.name.charAt(0)}
                                            </span>
                                            {m.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recurring */}
                    <div className="cal-field">
                        <label className="cal-label">{t.calendar.recurringLabel}</label>
                        <select
                            className="cal-select"
                            value={recurringFreq}
                            onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency | '')}
                        >
                            <option value="">{t.calendar.recurringNone}</option>
                            <option value="weekly">{t.calendar.recurringWeekly}</option>
                            <option value="monthly">{t.calendar.recurringMonthly}</option>
                            <option value="yearly">{t.calendar.recurringYearly}</option>
                        </select>
                    </div>

                    {recurringFreq && (
                        <div className="cal-field">
                            <label className="cal-label">{t.calendar.recurringUntilLabel}</label>
                            <CustomDatePicker value={recurringUntil} onChange={setRecurringUntil} openUp />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="cal-modal-footer">
                    {isEdit && onDelete && (
                        <button className="cal-btn-delete" onClick={handleDelete}>
                            {t.calendar.deleteEvent}
                        </button>
                    )}
                    <button className="cal-btn-cancel" onClick={onClose}>
                        {t.cancel}
                    </button>
                    <button
                        className="cal-btn-save"
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                    >
                        {t.calendar.saveBtn}
                    </button>
                </div>
            </div>
        </div>
    )
}
