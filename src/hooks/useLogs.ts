// src/hooks/useLogs.ts
import { useEffect, useState } from 'react'
import { subscribeLogs, addLog, deleteLog, clearAllLogs } from '../firebase/db'
import type { LogEntry } from '../types'

export const useLogs = (householdId: string) => {
    const [logs, setLogs] = useState<LogEntry[]>([])

    useEffect(() => {
        if (!householdId) return
        return subscribeLogs(householdId, setLogs)
    }, [householdId])

    const add = (entry: Omit<LogEntry, 'id'>) => addLog(householdId, entry)
    const remove = (id: string) => deleteLog(householdId, id)
    const clear = () => clearAllLogs(householdId)

    return { logs, add, remove, clear }
}
