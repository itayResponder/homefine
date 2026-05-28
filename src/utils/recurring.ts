// src/utils/recurring.ts
import { addTransaction } from '../firebase/db'
import type { RecurringCharge, Transaction } from '../types'

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

/**
 * Computes the first month (YYYY-MM) for a recurring charge based on a chosen date.
 * - If the chosen date is in the current month (past or future within this month) → next month
 * - If the chosen date is in a future month → that month
 * - If the chosen date is in the past month → next month from today
 */
export function computeStartYearMonth(chosenDate: string): string {
    const d = new Date(chosenDate)
    const today = new Date()

    const chosenYear = d.getFullYear()
    const chosenMonth = d.getMonth() // 0-indexed

    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()

    const isCurrentOrPast =
        chosenYear < todayYear ||
        (chosenYear === todayYear && chosenMonth <= todayMonth)

    let startYear: number
    let startMonth: number // 0-indexed

    if (isCurrentOrPast) {
        // Start from next month
        startYear = todayYear
        startMonth = todayMonth + 1
        if (startMonth > 11) { startMonth = 0; startYear += 1 }
    } else {
        // Future month: use as-is
        startYear = chosenYear
        startMonth = chosenMonth
    }

    return `${startYear}-${String(startMonth + 1).padStart(2, '0')}`
}
