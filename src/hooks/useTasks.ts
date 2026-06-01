// src/hooks/useTasks.ts
import { useEffect, useState } from 'react'
import { subscribeTasks, addTask, removeTask, completeTask as dbCompleteTask, updateTask } from '../firebase/homeDb'
import type { Task } from '../types/home'

export const useTasks = (householdId: string) => {
    const [tasks, setTasks] = useState<Task[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!householdId) return
        const unsub = subscribeTasks(householdId, (data) => {
            setTasks(data)
            setReady(true)
        })
        return unsub
    }, [householdId])

    const add = (task: Omit<Task, 'id'>) => addTask(householdId, task)
    const remove = (id: string) => removeTask(householdId, id)
    const complete = (task: Task) => dbCompleteTask(householdId, task)
    const update = (id: string, data: Partial<Omit<Task, 'id'>>) => updateTask(householdId, id, data)

    return { tasks, ready, add, remove, complete, update }
}
