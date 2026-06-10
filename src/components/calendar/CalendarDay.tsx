// src/components/calendar/CalendarDay.tsx
import { useI18n } from '../../i18n/context'
import type { CalendarEvent, Member } from '../../types'
import { nameToColor } from '../../utils/color'

const MAX_PILLS = 3
const MAX_AVATARS = 2

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
    members: Member[]
    onDayClick: (date: Date) => void
    onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void
}

export function CalendarDay({
    date,
    isCurrentMonth,
    isToday,
    dayEvents,
    totalEvents,
    members,
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

            {visibleEvents.map(({ event, spanType }) => {
                const showContent = spanType !== 'mid' && spanType !== 'end'
                const eventParticipants = event.participants ?? []
                const taggedMembers = showContent && eventParticipants.length > 0
                    ? members.filter(m => eventParticipants.includes(m.id)).slice(0, MAX_AVATARS)
                    : []

                return (
                    <span
                        key={event.id + '-' + date.getDate()}
                        className={`cal-event-pill${spanClass(spanType)}`}
                        style={{ background: event.color || 'var(--ac, #2563EB)' }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event, e) }}
                        title={event.title}
                    >
                        {showContent ? (
                            <span className="cal-pill-inner">
                                <span className="cal-pill-title">{event.title}</span>
                                {taggedMembers.length > 0 && (
                                    <span className="cal-pill-avatars">
                                        {taggedMembers.map(m => (
                                            <span
                                                key={m.id}
                                                className="cal-pill-avatar"
                                                style={{ background: nameToColor(m.name) }}
                                                title={m.name}
                                            >
                                                {m.name.charAt(0)}
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </span>
                        ) : ' '}
                    </span>
                )
            })}

            {hidden > 0 && (
                <span className="cal-more-link">
                    {t.calendar.moreEvents(hidden)}
                </span>
            )}
        </div>
    )
}
