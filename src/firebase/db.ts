// src/firebase/db.ts
import { ref, push, set, remove, update, onValue, off, onDisconnect } from 'firebase/database'
import { db } from './config'
import type { Member, Transaction, RecurringCharge, LogEntry } from '../types'

// ─── Members ───────────────────────────────────────────────────────────────
export const addMember = (member: Omit<Member, 'id'>) =>
    push(ref(db, 'members'), member)

export const removeMember = (id: string) =>
    remove(ref(db, `members/${id}`))

export const subscribeMembers = (cb: (members: Member[]) => void) => {
    const r = ref(db, 'members')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        const members: Member[] = Object.entries(data).map(([id, val]) => ({
            id, ...(val as Omit<Member, 'id'>),
        }))
        cb(members)
    })
    return () => off(r)
}

// ─── Transactions ───────────────────────────────────────────────────────────
export const addTransaction = (tx: Omit<Transaction, 'id'>) =>
    push(ref(db, 'transactions'), tx)

export const removeTransaction = (id: string) =>
    remove(ref(db, `transactions/${id}`))

export const updateTransaction = (id: string, data: Partial<Transaction>) =>
    update(ref(db, `transactions/${id}`), data)

export const subscribeTransactions = (cb: (txs: Transaction[]) => void) => {
    const r = ref(db, 'transactions')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        const txs: Transaction[] = Object.entries(data).map(([id, val]) => ({
            id, ...(val as Omit<Transaction, 'id'>),
        }))
        cb(txs)
    })
    return () => off(r)
}

// ─── Recurring Charges ──────────────────────────────────────────────────────
export const addRecurringCharge = (charge: Omit<RecurringCharge, 'id'>) =>
    push(ref(db, 'recurringCharges'), charge)

export const removeRecurringCharge = (id: string) =>
    remove(ref(db, `recurringCharges/${id}`))

export const updateRecurringCharge = (id: string, data: Partial<RecurringCharge>) =>
    update(ref(db, `recurringCharges/${id}`), data)

export const subscribeRecurringCharges = (cb: (charges: RecurringCharge[]) => void) => {
    const r = ref(db, 'recurringCharges')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        const charges: RecurringCharge[] = Object.entries(data).map(([id, val]) => ({
            id, ...(val as Omit<RecurringCharge, 'id'>),
        }))
        cb(charges)
    })
    return () => off(r)
}

// ─── Logs ───────────────────────────────────────────────────────────────────
export const addLog = (log: Omit<LogEntry, 'id'>) =>
    push(ref(db, 'logs'), log)

export const subscribeLogs = (cb: (logs: LogEntry[]) => void) => {
    const r = ref(db, 'logs')
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
export const setPresence = (uid: string, data: { name: string; ts: number } | null) => {
    const r = ref(db, `presence/${uid}`)
    return data === null ? remove(r) : set(r, data)
}

export const setupDisconnectCleanup = (uid: string) =>
    onDisconnect(ref(db, `presence/${uid}`)).remove()

export const subscribePresence = (
    cb: (users: Record<string, { name: string; ts: number }>) => void,
) => {
    const r = ref(db, 'presence')
    onValue(r, (snap) => cb(snap.val() ?? {}))
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

// ─── Connection state ─────────────────────────────────────────────────────────
export const subscribeConnectionState = (cb: (connected: boolean) => void) => {
    const r = ref(db, '.info/connected')
    onValue(r, (snap) => cb(snap.val() === true))
    return () => off(r)
}
