// src/components/calendar/CalendarGrid.tsx
import { useMemo } from 'react'
import { useI18n } from '../../i18n/context'
import { CalendarDay } from './CalendarDay'
import type { CalendarEvent } from '../../types'

// Short day names — Sun→Sat in LTR, same order for RTL (grid stays same)
const DOW_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toYMD(d: Date): string {
    return d.toISOString().slice(0, 10)
}

function buildGridDays(year: number, month: number): Date[] {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const days: Date[] = []

    // pad start (week starts Sunday)
    for (let i = 0; i < first.getDay(); i++) {
        days.push(new Date(year, month, 1 - first.getDay() + i))
    }
    // current month
    for (let d = 1; d <= last.getDate(); d++) {
        days.push(new Date(year, month, d))
    }
    // pad end to fill last row
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            days.push(new Date(year, month + 1, i))
        }
    }
    return days
}

interface DayEvent {
    event: CalendarEvent
    spanType: 'single' | 'start' | 'mid' | 'end'
}

function getEventsForDay(date: Date, events: CalendarEvent[]): DayEvent[] {
    const ymd = toYMD(date)
    const result: DayEvent[] = []

    for (const event of events) {
        if (ymd < event.startDate || ymd > event.endDate) continue
        const isMultiDay = event.startDate !== event.endDate
        let spanType: DayEvent['spanType'] = 'single'
        if (isMultiDay) {
            if (ymd === event.startDate) spanType = 'start'
            else if (ymd === event.endDate) spanType = 'end'
            else spanType = 'mid'
        }
        result.push({ event, spanType })
    }
    return result
}

interface Props {
    year: number
    month: number
    events: CalendarEvent[]
    onDayClick: (date: Date) => void
    onEventClick: (event: CalendarEvent) => void
}

export function CalendarGrid({ year, month, events, onDayClick, onEventClick }: Props) {
    const { t, lang } = useI18n()
    const today = toYMD(new Date())
    const dowLabels = lang === 'he' ? DOW_HE : DOW_EN
    const gridDays = useMemo(() => buildGridDays(year, month), [year, month])

    return (
        <div className="cal-grid-wrap">
            {/* Day-of-week header */}
            <div className="cal-dow-row">
                {dowLabels.map((d) => (
                    <div key={d} className="cal-dow-cell">{d}</div>
                ))}
            </div>

            {/* Grid */}
            <div className="cal-grid">
                {gridDays.map((date) => {
                    const dayEvents = getEventsForDay(date, events)
                    return (
                        <CalendarDay
                            key={toYMD(date)}
                            date={date}
                            isCurrentMonth={date.getMonth() === month}
                            isToday={toYMD(date) === today}
                            dayEvents={dayEvents}
                            totalEvents={dayEvents.length}
                            onDayClick={onDayClick}
                            onEventClick={(ev, e) => { e.stopPropagation(); onEventClick(ev) }}
                        />
                    )
                })}
            </div>
        </div>
    )
}
