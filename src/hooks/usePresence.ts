// src/hooks/usePresence.ts
import { useEffect, useState } from 'react'
import { setPresence, setupDisconnectCleanup, subscribePresence } from '../firebase/db'
import type { AppUser } from '../types'

export type PresenceMap = Record<string, { name: string; ts: number }>

export const usePresence = (householdId: string, user: AppUser | null): PresenceMap => {
    const [online, setOnline] = useState<PresenceMap>({})

    useEffect(() => {
        if (!user || !householdId) return
        const { uid, displayName } = user
        setPresence(householdId, uid, { name: displayName, ts: Date.now() })
        setupDisconnectCleanup(householdId, uid)
        return () => { setPresence(householdId, uid, null) }
    }, [user, householdId])

    useEffect(() => {
        if (!householdId) return
        return subscribePresence(householdId, setOnline)
    }, [householdId])

    return online
}
