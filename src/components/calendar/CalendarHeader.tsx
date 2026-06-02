// src/components/calendar/CalendarHeader.tsx
import { useI18n } from '../../i18n/context'

interface Props {
    year: number
    month: number                     // 0-based
    onPrev: () => void
    onNext: () => void
    onToday: () => void
    onAddEvent: () => void
}

export function CalendarHeader({ year, month, onPrev, onNext, onToday, onAddEvent }: Props) {
    const { t } = useI18n()

    return (
        <div className="cal-toolbar">
            <button className="cal-toolbar-today" onClick={onToday}>
                {t.calendar.today}
            </button>

            <div className="cal-toolbar-nav">
                <button className="cal-toolbar-arrow" onClick={onPrev} aria-label="Previous month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points={t.dir === 'rtl' ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
                    </svg>
                </button>
                <span className="cal-toolbar-month">
                    {t.monthNames[month]} {year}
                </span>
                <button className="cal-toolbar-arrow" onClick={onNext} aria-label="Next month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points={t.dir === 'rtl' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
                    </svg>
                </button>
            </div>

            <button className="cal-toolbar-add" onClick={onAddEvent}>
                + {t.calendar.newEvent}
            </button>
        </div>
    )
}
