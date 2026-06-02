// src/hooks/useCalendarEvents.ts
import { useEffect, useState } from 'react'
import { subscribeCalendarEvents } from '../firebase/calendarDb'
import type { CalendarEvent } from '../types'

export function useCalendarEvents(householdId: string): {
    events: CalendarEvent[]
    ready: boolean
} {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!householdId) return
        setReady(false)
        const unsub = subscribeCalendarEvents(householdId, (data) => {
            setEvents(data)
            setReady(true)
        })
        return unsub
    }, [householdId])

    return { events, ready }
}
