// src/firebase/homeDb.ts
import { ref, push, remove, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { Task, ShoppingItem, TaskStatus } from '../types/home'

const hRef = (householdId: string, path: string) =>
    ref(db, `households/${householdId}/${path}`)

// ── Tasks ────────────────────────────────────────────────────────────────────

export const addTask = (householdId: string, task: Omit<Task, 'id'>) =>
    push(hRef(householdId, 'tasks'), task)

export const removeTask = (householdId: string, id: string) =>
    remove(hRef(householdId, `tasks/${id}`))

export const updateTask = (householdId: string, id: string, data: Partial<Omit<Task, 'id'>>) => {
    // Firebase rejects undefined values; convert to null (Firebase deletes null fields)
    const cleaned = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v]),
    )
    return update(hRef(householdId, `tasks/${id}`), cleaned)
}

export const completeTask = async (householdId: string, task: Task): Promise<void> => {
    const doneBy =
        task.assignedTo === 'rotation'
            ? task.rotationOrder?.[0]
            : task.assignedTo

    const updates: Partial<Omit<Task, 'id'>> = {
        lastDoneAt: Date.now(),
        lastDoneBy: doneBy,
    }

    if (task.assignedTo === 'rotation' && task.rotationOrder && task.rotationOrder.length > 1) {
        updates.rotationOrder = [
            ...task.rotationOrder.slice(1),
            task.rotationOrder[0],
        ]
    }

    await updateTask(householdId, task.id, updates)
}

export const moveTaskStatus = async (householdId: string, task: Task, newStatus: TaskStatus): Promise<void> => {
    const updates: Partial<Omit<Task, 'id'>> = { status: newStatus }

    if (newStatus === 'in-progress' && !task.startedAt) {
        updates.startedAt = Date.now()
    }
    if (newStatus === 'done') {
        updates.lastDoneAt = Date.now()
        const doneBy = task.assignedTo === 'rotation' ? task.rotationOrder?.[0] : task.assignedTo
        updates.lastDoneBy = doneBy
        if (task.assignedTo === 'rotation' && task.rotationOrder && task.rotationOrder.length > 1) {
            updates.rotationOrder = [...task.rotationOrder.slice(1), task.rotationOrder[0]]
        }
    }

    await updateTask(householdId, task.id, updates)
}

export const batchUpdateTaskOrders = (
    householdId: string,
    updates: { id: string; order: number }[],
): Promise<void> => {
    const payload: Record<string, number> = {}
    for (const { id, order } of updates) {
        payload[`households/${householdId}/tasks/${id}/order`] = order
    }
    return update(ref(db), payload)
}

export const subscribeTasks = (householdId: string, cb: (tasks: Task[]) => void) => {
    const r = hRef(householdId, 'tasks')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([id, val]) => ({ id, ...(val as Omit<Task, 'id'>) })))
    })
    return () => off(r)
}

// ── Shopping ──────────────────────────────────────────────────────────────────

export const addShoppingItem = (householdId: string, item: Omit<ShoppingItem, 'id'>) =>
    push(hRef(householdId, 'shoppingItems'), item)

export const toggleShoppingItem = (
    householdId: string,
    id: string,
    done: boolean,
    doneBy?: string,
) =>
    update(hRef(householdId, `shoppingItems/${id}`), {
        done,
        doneBy: done ? (doneBy ?? null) : null,
        doneAt: done ? Date.now() : null,
    })

export const removeShoppingItem = (householdId: string, id: string) =>
    remove(hRef(householdId, `shoppingItems/${id}`))

export const clearDoneItems = (householdId: string, items: ShoppingItem[]): Promise<void[]> =>
    Promise.all(items.filter((i) => i.done).map((i) => removeShoppingItem(householdId, i.id)))

export const subscribeShoppingItems = (householdId: string, cb: (items: ShoppingItem[]) => void) => {
    const r = hRef(householdId, 'shoppingItems')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        const items = Object.entries(data)
            .map(([id, val]) => ({ id, ...(val as Omit<ShoppingItem, 'id'>) }))
            .sort((a, b) => a.createdAt - b.createdAt)
        cb(items)
    })
    return () => off(r)
}
