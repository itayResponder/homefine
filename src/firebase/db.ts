// src/firebase/db.ts
import { ref, push, set, remove, update, onValue, off, onDisconnect, get } from 'firebase/database'

import { db } from './config'
import type { Member, Transaction, RecurringCharge, LogEntry, HouseholdMeta } from '../types'

// ─── Helpers ────────────────────────────────────────────────────────────────
const hRef = (householdId: string, path: string) =>
    ref(db, `households/${householdId}/${path}`)

// ─── Households ─────────────────────────────────────────────────────────────
export const createHousehold = async (name: string, ownerId: string): Promise<string> => {
    const newRef = push(ref(db, 'households'))
    const householdId = newRef.key!
    const meta: HouseholdMeta = { name, ownerId, createdAt: Date.now() }
    await set(ref(db, `households/${householdId}/meta`), meta)
    await set(ref(db, `userHouseholds/${ownerId}/${householdId}`), true)
    return householdId
}

export const getHouseholdMeta = async (householdId: string): Promise<HouseholdMeta | null> => {
    const snap = await get(ref(db, `households/${householdId}/meta`))
    return snap.exists() ? (snap.val() as HouseholdMeta) : null
}

export const joinHousehold = async (householdId: string, uid: string): Promise<void> => {
    await set(ref(db, `userHouseholds/${uid}/${householdId}`), true)
}

export const leaveHousehold = async (householdId: string, uid: string): Promise<void> => {
    await remove(ref(db, `userHouseholds/${uid}/${householdId}`))
    await remove(ref(db, `households/${householdId}/participants/${uid}`)).catch(() => {})
}

export const deleteHousehold = async (householdId: string): Promise<void> => {
    const snap = await get(ref(db, `households/${householdId}/participants`))
    const uids: string[] = snap.exists() ? Object.keys(snap.val()) : []
    await Promise.all(uids.map(uid => remove(ref(db, `userHouseholds/${uid}/${householdId}`))))
    await remove(ref(db, `households/${householdId}`))
}

export const getUserHouseholdIds = async (uid: string): Promise<string[]> => {
    const snap = await get(ref(db, `userHouseholds/${uid}`))
    return snap.exists() ? Object.keys(snap.val()) : []
}

export const subscribeUserHouseholds = (
    uid: string,
    cb: (ids: string[]) => void,
) => {
    const r = ref(db, `userHouseholds/${uid}`)
    onValue(r, (snap) => cb(snap.exists() ? Object.keys(snap.val()) : []))
    return () => off(r)
}

export const updateHouseholdMeta = (householdId: string, data: Partial<HouseholdMeta>) =>
    update(ref(db, `households/${householdId}/meta`), data)

export const subscribeHouseholdMeta = (
    householdId: string,
    cb: (meta: HouseholdMeta | null) => void,
) => {
    const r = ref(db, `households/${householdId}/meta`)
    onValue(r, (snap) => cb(snap.val() ?? null))
    return () => off(r)
}

// ─── Members ────────────────────────────────────────────────────────────────
export const addMember = (householdId: string, member: Omit<Member, 'id'>) =>
    push(hRef(householdId, 'members'), member)

export const removeMember = (householdId: string, id: string) =>
    remove(hRef(householdId, `members/${id}`))

export const updateMember = (householdId: string, id: string, data: Partial<Member>) =>
    update(hRef(householdId, `members/${id}`), data)

export const subscribeMembers = (householdId: string, cb: (members: Member[]) => void) => {
    const r = hRef(householdId, 'members')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([id, val]) => ({ id, ...(val as Omit<Member, 'id'>) })))
    })
    return () => off(r)
}

// ─── Transactions ────────────────────────────────────────────────────────────
export const addTransaction = (householdId: string, tx: Omit<Transaction, 'id'>) =>
    push(hRef(householdId, 'transactions'), tx)

export const removeTransaction = (householdId: string, id: string) =>
    remove(hRef(householdId, `transactions/${id}`))

export const updateTransaction = (householdId: string, id: string, data: Partial<Transaction>) =>
    update(hRef(householdId, `transactions/${id}`), data)

export const subscribeTransactions = (householdId: string, cb: (txs: Transaction[]) => void) => {
    const r = hRef(householdId, 'transactions')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([id, val]) => ({ id, ...(val as Omit<Transaction, 'id'>) })))
    })
    return () => off(r)
}

// ─── Recurring Charges ───────────────────────────────────────────────────────
export const addRecurringCharge = (householdId: string, charge: Omit<RecurringCharge, 'id'>) =>
    push(hRef(householdId, 'recurringCharges'), charge)

export const removeRecurringCharge = (householdId: string, id: string) =>
    remove(hRef(householdId, `recurringCharges/${id}`))

export const updateRecurringCharge = (householdId: string, id: string, data: Partial<RecurringCharge>) =>
    update(hRef(householdId, `recurringCharges/${id}`), data)

export const subscribeRecurringCharges = (householdId: string, cb: (charges: RecurringCharge[]) => void) => {
    const r = hRef(householdId, 'recurringCharges')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([id, val]) => ({ id, ...(val as Omit<RecurringCharge, 'id'>) })))
    })
    return () => off(r)
}

// ─── Logs ────────────────────────────────────────────────────────────────────
export const addLog = (householdId: string, log: Omit<LogEntry, 'id'>) =>
    push(hRef(householdId, 'logs'), log)

export const deleteLog = (householdId: string, id: string) =>
    remove(hRef(householdId, `logs/${id}`))

export const clearAllLogs = (householdId: string) =>
    remove(hRef(householdId, 'logs'))

export const subscribeLogs = (householdId: string, cb: (logs: LogEntry[]) => void) => {
    const r = hRef(householdId, 'logs')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        const logs: LogEntry[] = Object.entries(data)
            .map(([id, val]) => ({ id, ...(val as Omit<LogEntry, 'id'>) }))
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 300)
        cb(logs)
    })
    return () => off(r)
}

// ─── Presence ────────────────────────────────────────────────────────────────
export const setPresence = (householdId: string, uid: string, data: { name: string; ts: number } | null) => {
    const r = hRef(householdId, `presence/${uid}`)
    return data === null ? remove(r) : set(r, data)
}

export const setupDisconnectCleanup = (householdId: string, uid: string) =>
    onDisconnect(hRef(householdId, `presence/${uid}`)).remove()

export const subscribePresence = (
    householdId: string,
    cb: (users: Record<string, { name: string; ts: number }>) => void,
) => {
    const r = hRef(householdId, 'presence')
    onValue(r, (snap) => cb(snap.val() ?? {}))
    return () => off(r)
}

// ─── Connection state ─────────────────────────────────────────────────────────
export const subscribeConnectionState = (cb: (connected: boolean) => void) => {
    const r = ref(db, '.info/connected')
    onValue(r, (snap) => cb(snap.val() === true))
    return () => off(r)
}

// ─── Join Requests ───────────────────────────────────────────────────────────
type JoinRequestData = { name: string; email: string; photoURL?: string; ts: number }

export const createJoinRequest = (householdId: string, uid: string, data: JoinRequestData) =>
    set(ref(db, `households/${householdId}/joinRequests/${uid}`), data)

export const approveJoinRequest = async (householdId: string, uid: string, participantData?: { name: string; email: string; photoURL?: string }): Promise<void> => {
    await set(ref(db, `userHouseholds/${uid}/${householdId}`), true)
    await remove(ref(db, `households/${householdId}/joinRequests/${uid}`))
    if (participantData) {
        await set(ref(db, `households/${householdId}/participants/${uid}`), { ...participantData, joinedAt: Date.now() })
    }
}

export const denyJoinRequest = (householdId: string, uid: string) =>
    remove(ref(db, `households/${householdId}/joinRequests/${uid}`))

export const subscribeJoinRequests = (
    householdId: string,
    cb: (requests: Array<JoinRequestData & { uid: string }>) => void,
) => {
    const r = ref(db, `households/${householdId}/joinRequests`)
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([uid, val]) => ({ uid, ...(val as JoinRequestData) })))
    })
    return () => off(r)
}

// ─── User Preferences ────────────────────────────────────────────────────────
export const setUserColor = (uid: string, color: string) =>
    set(ref(db, `userPrefs/${uid}/primaryColor`), color)

export const subscribeUserColor = (uid: string, cb: (color: string | null) => void) => {
    const r = ref(db, `userPrefs/${uid}/primaryColor`)
    onValue(r, (snap) => cb(snap.val()))
    return () => off(r)
}

// ─── Participants ─────────────────────────────────────────────────────────────
type ParticipantData = { name: string; email: string; photoURL?: string; joinedAt: number }

export const subscribeUserMembership = (
    householdId: string,
    uid: string,
    cb: (isMember: boolean) => void,
) => {
    const r = ref(db, `userHouseholds/${uid}/${householdId}`)
    onValue(r, (snap) => cb(snap.val() === true))
    return () => off(r)
}

export const seedParticipant = async (householdId: string, uid: string, data: ParticipantData): Promise<void> => {
    const r = ref(db, `households/${householdId}/participants/${uid}`)
    const snap = await get(r)
    if (!snap.exists()) await set(r, data)
}

export const subscribeParticipants = (
    householdId: string,
    cb: (participants: Array<ParticipantData & { uid: string }>) => void,
) => {
    const r = ref(db, `households/${householdId}/participants`)
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([uid, val]) => ({ uid, ...(val as ParticipantData) })))
    })
    return () => off(r)
}

export const removeParticipant = async (householdId: string, uid: string): Promise<void> => {
    await remove(ref(db, `userHouseholds/${uid}/${householdId}`))
    await remove(ref(db, `households/${householdId}/participants/${uid}`))
}
