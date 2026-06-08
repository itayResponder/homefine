import { useEffect, useRef } from 'react'
import { applyRecurring } from '../utils/recurring'
import type { RecurringCharge, Transaction } from '../types'

export function useRecurringAutoApply(
    householdId: string,
    recurringCharges: RecurringCharge[],
    transactions: Transaction[],
    month: string,
) {
    const txRef = useRef(transactions)
    useEffect(() => { txRef.current = transactions }, [transactions])

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const [year, m] = month.split('-').map(Number)
            applyRecurring(householdId, recurringCharges, txRef.current, year, m - 1)
        }, 600)
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [month, recurringCharges])
}
