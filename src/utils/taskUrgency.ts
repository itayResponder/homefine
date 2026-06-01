// src/utils/taskUrgency.ts
import type { Task, TaskUrgency } from '../types/home'

export function getTaskUrgency(task: Task): TaskUrgency {
    if (task.intervalDays === 0) {
        // one-time task: done = fresh, never done = overdue
        return task.lastDoneAt ? 'fresh' : 'overdue'
    }
    if (!task.lastDoneAt) return 'overdue'
    const daysSince = (Date.now() - task.lastDoneAt) / 86400000
    const ratio = daysSince / task.intervalDays
    if (ratio < 0.5)  return 'fresh'
    if (ratio < 0.85) return 'medium'
    if (ratio < 1.0)  return 'due'
    return 'overdue'
}

export function getDaysSince(lastDoneAt: number | undefined): number | null {
    if (!lastDoneAt) return null
    return Math.floor((Date.now() - lastDoneAt) / 86400000)
}
