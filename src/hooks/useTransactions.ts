// src/hooks/useTransactions.ts
import { useEffect, useState } from 'react'
import { subscribeTransactions, addTransaction, removeTransaction, updateTransaction } from '../firebase/db'
import type { Transaction } from '../types'

export const useTransactions = (householdId: string) => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!householdId) return
        const unsub = subscribeTransactions(householdId, (data) => {
            setTransactions(data)
            setReady(true)
        })
        return unsub
    }, [householdId])

    const add = (tx: Omit<Transaction, 'id'>) => addTransaction(householdId, tx)
    const remove = (id: string) => removeTransaction(householdId, id)
    const update = (id: string, data: Partial<Transaction>) => updateTransaction(householdId, id, data)

    return { transactions, ready, add, remove, update }
}
