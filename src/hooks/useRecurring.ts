// src/hooks/useRecurring.ts
import { useEffect, useState } from 'react'
import { subscribeRecurringCharges, addRecurringCharge, removeRecurringCharge, updateRecurringCharge } from '../firebase/db'
import type { RecurringCharge } from '../types'

export const useRecurring = (householdId: string) => {
    const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!householdId) return
        const unsub = subscribeRecurringCharges(householdId, (data) => {
            setRecurringCharges(data)
            setReady(true)
        })
        return unsub
    }, [householdId])

    const add = (charge: Omit<RecurringCharge, 'id'>) => addRecurringCharge(householdId, charge)
    const remove = (id: string) => removeRecurringCharge(householdId, id)
    const update = (id: string, data: Partial<RecurringCharge>) => updateRecurringCharge(householdId, id, data)

    return { recurringCharges, ready, add, remove, update }
}
