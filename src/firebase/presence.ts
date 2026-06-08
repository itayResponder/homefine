import { ref, set, remove, update, onValue, off, onDisconnect } from 'firebase/database'
import { db } from './config'

export type PresenceRecord = { name: string; photoURL?: string; ts: number; online: boolean }

const hRef = (householdId: string, path: string) =>
    ref(db, `households/${householdId}/${path}`)

export const setPresence = (householdId: string, uid: string, data: PresenceRecord | null) => {
    const r = hRef(householdId, `presence/${uid}`)
    return data === null ? remove(r) : set(r, data)
}

export const setPresenceOnline = (householdId: string, uid: string, online: boolean) =>
    update(hRef(householdId, `presence/${uid}`), { online })

export const setupDisconnectCleanup = (householdId: string, uid: string) =>
    onDisconnect(hRef(householdId, `presence/${uid}`)).update({ online: false })

export const subscribePresence = (
    householdId: string,
    cb: (users: Record<string, PresenceRecord>) => void,
) => {
    const r = hRef(householdId, 'presence')
    onValue(r, (snap) => cb(snap.val() ?? {}))
    return () => off(r)
}
