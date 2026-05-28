// src/hooks/useRecurring.ts
import { useEffect, useState } from 'react'
import {
    subscribeRecurringCharges,
    addRecurringCharge,
    removeRecurringCharge,
    updateRecurringCharge,
} from '../firebase/db'
import type { RecurringCharge } from '../types'

export const useRecurring = () => {
    const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>([])

    useEffect(() => {
        const unsub = subscribeRecurringCharges(setRecurringCharges)
        return unsub
    }, [])

    const add = (charge: Omit<RecurringCharge, 'id'>) => addRecurringCharge(charge)
    const remove = (id: string) => removeRecurringCharge(id)
    const update = (id: string, data: Partial<RecurringCharge>) => updateRecurringCharge(id, data)

    return { recurringCharges, add, remove, update }
}
