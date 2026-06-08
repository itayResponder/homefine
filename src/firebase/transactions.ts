import { ref, push, remove, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { Transaction, RecurringCharge, LogEntry } from '../types'

const hRef = (householdId: string, path: string) =>
    ref(db, `households/${householdId}/${path}`)

// ─── Transactions ─────────────────────────────────────────────────────────────
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

// ─── Recurring Charges ────────────────────────────────────────────────────────
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

// ─── Logs ─────────────────────────────────────────────────────────────────────
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
