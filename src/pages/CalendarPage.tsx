// src/pages/CalendarPage.tsx
import { useState, useCallback } from 'react'
import { useHouseholdContext } from './HouseholdLayout'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../firebase/calendarDb'
import { CalendarHeader } from '../components/calendar/CalendarHeader'
import { CalendarGrid } from '../components/calendar/CalendarGrid'
import { EventModal } from '../components/calendar/EventModal'
import '../components/calendar/CalendarPage.css'
import type { CalendarEvent } from '../types'

function toYMD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

type ModalState =
    | { mode: 'create'; defaultDate: string }
    | { mode: 'edit'; event: CalendarEvent }
    | null

export default function CalendarPage() {
    const { householdId, user, members, primaryColor } = useHouseholdContext()
    const { events } = useCalendarEvents(householdId)

    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth())
    const [modal, setModal] = useState<ModalState>(null)

    const prevMonth = useCallback(() => {
        setMonth((m) => { if (m === 0) { setYear((y) => y - 1); return 11 } return m - 1 })
    }, [])

    const nextMonth = useCallback(() => {
        setMonth((m) => { if (m === 11) { setYear((y) => y + 1); return 0 } return m + 1 })
    }, [])

    const goToday = useCallback(() => {
        const n = new Date()
        setYear(n.getFullYear())
        setMonth(n.getMonth())
    }, [])

    const handleDayClick = useCallback((date: Date) => {
        const ymd = toYMD(date)
        const dayEvents = events.filter(e => e.startDate <= ymd && ymd <= e.endDate)
        if (dayEvents.length === 1) {
            setModal({ mode: 'edit', event: dayEvents[0] })
        } else {
            setModal({ mode: 'create', defaultDate: ymd })
        }
    }, [events])

    const handleEventClick = useCallback((event: CalendarEvent) => {
        setModal({ mode: 'edit', event })
    }, [])

    const handleSave = useCallback(async (data: Omit<CalendarEvent, 'id'>) => {
        if (modal?.mode === 'edit') {
            await updateCalendarEvent(householdId, modal.event.id, data)
        } else {
            await addCalendarEvent(householdId, data)
        }
    }, [householdId, modal])

    const handleDelete = useCallback(async (eventId: string) => {
        await deleteCalendarEvent(householdId, eventId)
    }, [householdId])

    return (
        <div className="cal-root">
            <CalendarHeader
                year={year}
                month={month}
                onPrev={prevMonth}
                onNext={nextMonth}
                onToday={goToday}
                onAddEvent={() => setModal({ mode: 'create', defaultDate: toYMD(new Date()) })}
            />

            <CalendarGrid
                year={year}
                month={month}
                events={events}
                members={members}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
            />

            {modal && (
                <EventModal
                    event={modal.mode === 'edit' ? modal.event : undefined}
                    defaultDate={modal.mode === 'create' ? modal.defaultDate : undefined}
                    members={members}
                    currentUserId={user?.uid ?? ''}
                    primaryColor={primaryColor}
                    onSave={handleSave}
                    onDelete={modal.mode === 'edit' ? handleDelete : undefined}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    )
}
