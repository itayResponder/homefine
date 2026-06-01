// src/types/home.ts

export type TaskRoom = 'bathroom' | 'kitchen' | 'living' | 'bedroom' | 'general' | 'outdoor'

export type TaskUrgency = 'fresh' | 'medium' | 'due' | 'overdue'

export interface Task {
    id: string
    title: string
    room: TaskRoom
    assignedTo: string | 'rotation'  // memberId or 'rotation'
    rotationOrder?: string[]          // rotation: current assignee is [0], rotates on complete
    intervalDays: number              // 0 = one-time, >0 = recurring every N days
    lastDoneAt?: number
    lastDoneBy?: string               // memberId
    createdAt: number
    createdBy: string                 // memberId
}

export interface ShoppingItem {
    id: string
    text: string
    addedBy: string    // memberId
    done: boolean
    doneBy?: string    // memberId
    doneAt?: number
    createdAt: number
}
