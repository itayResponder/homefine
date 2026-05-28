// src/hooks/usePresence.ts
import { useEffect, useState } from 'react'
import { setPresence, setupDisconnectCleanup, subscribePresence } from '../firebase/db'
import type { AppUser } from '../types'

export type PresenceMap = Record<string, { name: string; ts: number }>

export const usePresence = (user: AppUser | null): PresenceMap => {
    const [online, setOnline] = useState<PresenceMap>({})

    // Register / deregister this user's presence
    useEffect(() => {
        if (!user) return
        const { uid, displayName } = user
        setPresence(uid, { name: displayName, ts: Date.now() })
        setupDisconnectCleanup(uid)
        return () => { setPresence(uid, null) }
    }, [user])

    // Subscribe to all online users
    useEffect(() => {
        return subscribePresence(setOnline)
    }, [])

    return online
}
