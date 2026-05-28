// src/types/index.ts

export interface Member {
    id: string
    name: string       // Hebrew / primary name
    nameEn?: string    // English name (optional)
    color: string
    createdAt: number
    userId?: string    // UID of the user who created this member card
}

export type TransactionType = 'expense' | 'income'
export type TransactionCategory =
    | 'rent' | 'electricity' | 'water' | 'gas' | 'internet' | 'mobile'
    | 'property_tax' | 'food' | 'entertainment' | 'health' | 'clothing'
    | 'transport' | 'education' | 'baby' | 'loan' | 'salary' | 'bills' | 'nela' | 'other'

export interface Transaction {
    id: string
    type: TransactionType
    amount: number
    description: string
    category: TransactionCategory
    memberId: string | 'shared'
    date: string           // YYYY-MM-DD
    createdAt: number
    recurringId?: string   // set when auto-generated from a RecurringCharge
}

export interface RecurringCharge {
    id: string
    description: string
    amount: number
    type: TransactionType          // expense | income
    category: TransactionCategory
    dayOfMonth: number             // 1–31
    memberId: string | 'shared'
    active: boolean
}

export interface LogDiff {
    field: string
    before: string
    after: string
}

export interface LogEntry {
    id: string
    action: 'add' | 'edit' | 'delete'
    entityType: 'transaction' | 'recurring'
    who: string            // displayName
    ts: number
    description: string
    amount: number
    memberId: string
    txType?: TransactionType
    diffs?: LogDiff[]
}

export interface AppUser {
    uid: string
    email: string
    displayName: string
    photoURL?: string
}
