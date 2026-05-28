// src/hooks/useLogs.ts
import { useEffect, useState } from 'react'
import { subscribeLogs, addLog } from '../firebase/db'
import type { LogEntry } from '../types'

export const useLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([])

    useEffect(() => {
        const unsub = subscribeLogs(setLogs)
        return unsub
    }, [])

    const add = (entry: Omit<LogEntry, 'id'>) => addLog(entry)

    return { logs, add }
}
