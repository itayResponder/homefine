// src/hooks/usePresence.ts
import { useEffect, useState } from 'react'
import { setPresence, setupDisconnectCleanup, subscribePresence } from '../firebase/db'
import type { AppUser, PresenceRecord } from '../types'

export type PresenceMap = Record<string, PresenceRecord>

export const usePresence = (householdId: string, user: AppUser | null): PresenceMap => {
    const [presence, setPresenceMap] = useState<PresenceMap>({})

    useEffect(() => {
        if (!user || !householdId) return
        const { uid, displayName, photoURL } = user
        setPresence(householdId, uid, {
            name: displayName,
            photoURL: photoURL ?? undefined,
            ts: Date.now(),
            online: true,
        })
        setupDisconnectCleanup(householdId, uid)
        return () => {
            // Mark offline but keep the record — disappears only when removed from household
            setPresence(householdId, uid, {
                name: displayName,
                photoURL: photoURL ?? undefined,
                ts: Date.now(),
                online: false,
            })
        }
    }, [user?.uid, householdId])

    useEffect(() => {
        if (!householdId) return
        return subscribePresence(householdId, setPresenceMap)
    }, [householdId])

    return presence
}
