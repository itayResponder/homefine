// src/types/index.ts

export interface Member {
    id: string
    name: string       // Hebrew / primary name
    nameEn?: string    // English name (optional)
    color: string
    createdAt: number
    userId?: string      // UID of the user who created this member card
    privateIncome?: boolean  // if true, income is only visible to this member
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
    type: TransactionType
    category: TransactionCategory
    dayOfMonth: number             // 1–31, extracted from startDate
    startYearMonth: string         // YYYY-MM, first month to apply
    monthCount: number             // total months to apply
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

export interface HouseholdSettings {
    expensesOnly?: boolean   // hides income tab for all members
}

export interface HouseholdMeta {
    name: string
    ownerId: string
    createdAt: number
    settings?: HouseholdSettings
}

export interface Household {
    id: string
    meta: HouseholdMeta
}

export interface JoinRequest {
    uid: string
    name: string
    email: string
    photoURL?: string
    ts: number
    householdId: string      // populated by hook
    householdName: string    // populated by hook
    nameHe?: string
    nameEn?: string
}

export interface Participant {
    uid: string
    name: string
    email: string
    photoURL?: string
    joinedAt: number
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export interface CalendarEvent {
    id: string
    title: string
    description?: string
    startDate: string          // "YYYY-MM-DD"
    endDate: string            // "YYYY-MM-DD" — equals startDate for single-day events
    startTime?: string         // "HH:MM" — omit for all-day
    endTime?: string           // "HH:MM"
    color?: string             // hex — defaults to creator's primaryColor
    createdBy: string          // uid
    participants: string[]     // uid[] — empty = whole household ("everyone")
    recurring?: {
        frequency: RecurringFrequency
        until?: string         // "YYYY-MM-DD" — omit for indefinite
    }
}
