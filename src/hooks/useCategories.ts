// src/hooks/useCategories.ts
import { useEffect, useState } from 'react'
import { subscribeCategories, seedCategories, seedSingleCategory, addCategory, updateCategory, deleteCategory } from '../firebase/db'
import type { Category } from '../types'

export function useCategories(householdId: string) {
    const [categories, setCategories] = useState<Category[]>([])
    const [categoriesReady, setCategoriesReady] = useState(false)
    const [seeding, setSeeding] = useState(false)

    useEffect(() => {
        if (!householdId) return
        let didSeed = false
        return subscribeCategories(householdId, async (cats) => {
            if (cats.length === 0 && !didSeed && !seeding) {
                didSeed = true
                setSeeding(true)
                await seedCategories(householdId)
                setSeeding(false)
                return
            }
            // Patch existing households: add missing defaults + fix changed icons
            const byId = Object.fromEntries(cats.map(c => [c.id, c]))
            const patches: Promise<unknown>[] = []
            if (!byId['automation'])
                patches.push(seedSingleCategory(householdId, 'automation', { name: 'אוטומציה', nameEn: 'Automation', icon: '⚡', order: 19 }))
            if (byId['electricity']?.icon === '⚡')
                patches.push(updateCategory(householdId, 'electricity', { icon: '💡' }))
            if (patches.length > 0) { await Promise.all(patches); return }
            setCategories(cats)
            setCategoriesReady(true)
        })
    }, [householdId])

    const handleAdd = async (cat: Omit<Category, 'id'>): Promise<string> => {
        const order = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0
        return addCategory(householdId, { ...cat, order })
    }

    const handleUpdate = (id: string, data: Partial<Omit<Category, 'id'>>) =>
        updateCategory(householdId, id, data)

    const handleDelete = (id: string) =>
        deleteCategory(householdId, id)

    return {
        categories,
        categoriesReady,
        addCategory: handleAdd,
        updateCategory: handleUpdate,
        deleteCategory: handleDelete,
    }
}
