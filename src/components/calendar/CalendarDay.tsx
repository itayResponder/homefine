// src/components/calendar/CalendarDay.tsx
import { useI18n } from '../../i18n/context'
import type { CalendarEvent } from '../../types'

const MAX_PILLS = 3

interface DayEvent {
    event: CalendarEvent
    spanType: 'single' | 'start' | 'mid' | 'end'
}

interface Props {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    dayEvents: DayEvent[]
    totalEvents: number
    onDayClick: (date: Date) => void
    onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void
}

export function CalendarDay({
    date,
    isCurrentMonth,
    isToday,
    dayEvents,
    totalEvents,
    onDayClick,
    onEventClick,
}: Props) {
    const { t } = useI18n()
    const visibleEvents = dayEvents.slice(0, MAX_PILLS)
    const hidden = totalEvents - visibleEvents.length

    const spanClass = (type: DayEvent['spanType']) => {
        if (type === 'start') return ' cal-event-pill--span-start'
        if (type === 'mid') return ' cal-event-pill--span-mid'
        if (type === 'end') return ' cal-event-pill--span-end'
        return ''
    }

    return (
        <div
            className={[
                'cal-day',
                !isCurrentMonth ? 'cal-day--other-month' : '',
                isToday ? 'cal-day--today' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onDayClick(date)}
        >
            <div className="cal-day-num">{date.getDate()}</div>

            {visibleEvents.map(({ event, spanType }) => (
                <span
                    key={event.id + '-' + date.toISOString()}
                    className={`cal-event-pill${spanClass(spanType)}`}
                    style={{ background: event.color || 'var(--ac, #2563EB)' }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event, e) }}
                    title={event.title}
                >
                    {spanType !== 'mid' && spanType !== 'end' ? event.title : ' '}
                </span>
            ))}

            {hidden > 0 && (
                <span className="cal-more-link">
                    {t.calendar.moreEvents(hidden)}
                </span>
            )}
        </div>
    )
}
