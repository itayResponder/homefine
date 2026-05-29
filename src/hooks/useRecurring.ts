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
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const unsub = subscribeRecurringCharges((data) => {
            setRecurringCharges(data)
            setReady(true)
        })
        return unsub
    }, [])

    const add = (charge: Omit<RecurringCharge, 'id'>) => addRecurringCharge(charge)
    const remove = (id: string) => removeRecurringCharge(id)
    const update = (id: string, data: Partial<RecurringCharge>) => updateRecurringCharge(id, data)

    return { recurringCharges, ready, add, remove, update }
}
