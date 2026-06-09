// src/utils/transactions.ts
import type { LogDiff, Transaction } from '../types'

export function computeDiffs(before: Transaction, after: Partial<Transaction>): LogDiff[] {
    const fields = ['description', 'amount', 'category', 'memberId', 'date'] as const
    return fields
        .filter((k) => after[k] !== undefined && String(before[k]) !== String(after[k]))
        .map((k) => ({ field: k, before: String(before[k]), after: String(after[k]!) }))
}
