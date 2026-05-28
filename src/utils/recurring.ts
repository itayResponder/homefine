// src/utils/recurring.ts
import { addTransaction } from '../firebase/db'
import type { RecurringCharge, Transaction } from '../types'

/**
 * For the given year/month, creates transactions from every active recurring charge
 * that hasn't been applied yet. Safe to call multiple times — idempotent.
 *
 * Applies when: the month is in the past, OR it's the current month and today >= the charge day.
 */
export async function applyRecurring(
    recurringCharges: RecurringCharge[],
    transactions: Transaction[],
    year: number,
    month: number, // 0-indexed (January = 0)
): Promise<void> {
    const today = new Date()
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

    const isPastMonth =
        year < today.getFullYear() ||
        (year === today.getFullYear() && month < today.getMonth())

    for (const r of recurringCharges) {
        if (!r.active) continue

        // Clamp day to the last day of the target month
        const lastDay = new Date(year, month + 1, 0).getDate()
        const actualDay = Math.min(r.dayOfMonth, lastDay)

        const isCurrent =
            year === today.getFullYear() &&
            month === today.getMonth() &&
            today.getDate() >= actualDay

        if (!isPastMonth && !isCurrent) continue

        const alreadyApplied = transactions.some(
            (tx) => tx.recurringId === r.id && tx.date.startsWith(monthKey),
        )
        if (alreadyApplied) continue

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
