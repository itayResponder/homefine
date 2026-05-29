// src/utils/recurring.ts
import { addTransaction } from '../firebase/db'
import type { RecurringCharge, Transaction } from '../types'

// Tracks in-flight transaction creations to prevent race-condition duplicates
const inProgress = new Set<string>()

export async function applyRecurring(
    recurringCharges: RecurringCharge[],
    transactions: Transaction[],
    year: number,
    month: number, // 0-indexed
): Promise<void> {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const currentTotal = year * 12 + month

    for (const r of recurringCharges) {
        if (!r.active) continue

        // Legacy charges without startYearMonth — skip (no longer auto-applied)
        if (!r.startYearMonth || !r.monthCount) continue

        const [sy, sm] = r.startYearMonth.split('-').map(Number)
        const startTotal = sy * 12 + (sm - 1)
        const endTotal = startTotal + r.monthCount - 1

        if (currentTotal < startTotal || currentTotal > endTotal) continue

        const lastDay = new Date(year, month + 1, 0).getDate()
        const actualDay = Math.min(r.dayOfMonth, lastDay)

        const key = `${r.id}_${monthKey}`
        const alreadyApplied = transactions.some(
            (tx) => tx.recurringId === r.id && tx.date.startsWith(monthKey),
        )
        if (alreadyApplied || inProgress.has(key)) continue

        inProgress.add(key)
        const dateStr = `${monthKey}-${String(actualDay).padStart(2, '0')}`
        await addTransaction({
            type: r.type,
            amount: r.amount,
            description: r.description,
            category: r.category,
            memberId: r.memberId,
            date: dateStr,
            createdAt: Date.now(),
            recurringId: r.id,
        })
    }
}

/**
 * Computes the first month (YYYY-MM) for a recurring charge based on a chosen date.
 * - If the chosen date is in the current month (past or future within this month) → next month
 * - If the chosen date is in a future month → that month
 * - If the chosen date is in the past month → next month from today
 */
// The chosen date's month IS the start month — always.
// The day extracted from the date determines which day in each month the charge appears.
export function computeStartYearMonth(chosenDate: string): string {
    const d = new Date(chosenDate)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
