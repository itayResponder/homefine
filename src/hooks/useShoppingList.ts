// src/hooks/useShoppingList.ts
import { useEffect, useState } from 'react'
import {
    subscribeShoppingItems,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearDoneItems,
} from '../firebase/homeDb'
import type { ShoppingItem } from '../types/home'

export const useShoppingList = (householdId: string) => {
    const [items, setItems] = useState<ShoppingItem[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!householdId) return
        const unsub = subscribeShoppingItems(householdId, (data) => {
            setItems(data)
            setReady(true)
        })
        return unsub
    }, [householdId])

    const add = (text: string, addedBy: string) =>
        addShoppingItem(householdId, {
            text: text.trim(),
            addedBy,
            done: false,
            createdAt: Date.now(),
        })

    const toggle = (id: string, done: boolean, doneBy?: string) =>
        toggleShoppingItem(householdId, id, done, doneBy)

    const remove = (id: string) => removeShoppingItem(householdId, id)

    const clearDone = () => clearDoneItems(householdId, items)

    return { items, ready, add, toggle, remove, clearDone }
}
