// src/firebase/calendarDb.ts
import { ref, push, set, remove, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { CalendarEvent } from '../types'

const eventsRef = (householdId: string) =>
    ref(db, `households/${householdId}/events`)

const eventRef = (householdId: string, eventId: string) =>
    ref(db, `households/${householdId}/events/${eventId}`)

export const subscribeCalendarEvents = (
    householdId: string,
    cb: (events: CalendarEvent[]) => void,
): (() => void) => {
    const r = eventsRef(householdId)
    onValue(r, (snap) => {
        if (!snap.exists()) { cb([]); return }
        const events: CalendarEvent[] = Object.entries(snap.val()).map(
            ([id, val]) => ({ ...(val as Omit<CalendarEvent, 'id'>), id }),
        )
        cb(events)
    })
    return () => off(r)
}

export const addCalendarEvent = async (
    householdId: string,
    event: Omit<CalendarEvent, 'id'>,
): Promise<string> => {
    const newRef = push(eventsRef(householdId))
    await set(newRef, event)
    return newRef.key!
}

export const updateCalendarEvent = (
    householdId: string,
    eventId: string,
    data: Partial<Omit<CalendarEvent, 'id'>>,
): Promise<void> => update(eventRef(householdId, eventId), data)

export const deleteCalendarEvent = (
    householdId: string,
    eventId: string,
): Promise<void> => remove(eventRef(householdId, eventId))
