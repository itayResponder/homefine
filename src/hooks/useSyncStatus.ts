// src/hooks/useSyncStatus.ts
import { useEffect, useState } from 'react'
import { subscribeConnectionState } from '../firebase/db'

export type SyncStatus = 'connecting' | 'connected'

export const useSyncStatus = (): SyncStatus => {
    const [status, setStatus] = useState<SyncStatus>('connecting')

    useEffect(() => {
        return subscribeConnectionState((connected) => {
            setStatus(connected ? 'connected' : 'connecting')
        })
    }, [])

    return status
}
