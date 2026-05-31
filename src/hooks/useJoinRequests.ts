// src/hooks/useJoinRequests.ts
import { useEffect, useRef, useState } from 'react'
import { subscribeJoinRequests } from '../firebase/db'
import type { JoinRequest } from '../types'

interface OwnedHousehold { id: string; name: string }

export function useJoinRequests(ownedHouseholds: OwnedHousehold[]) {
    const [byHousehold, setByHousehold] = useState<Map<string, JoinRequest[]>>(new Map())
    // Track which household IDs we are currently subscribed to
    const subscribedKey = useRef('')

    useEffect(() => {
        const key = ownedHouseholds.map((h) => h.id).join(',')
        if (key === subscribedKey.current) return
        subscribedKey.current = key

        // Reset on change
        setByHousehold(new Map())
        if (!ownedHouseholds.length) return

        const unsubs = ownedHouseholds.map((h) =>
            subscribeJoinRequests(h.id, (rawReqs) => {
                setByHousehold((prev) => {
                    const next = new Map(prev)
                    next.set(
                        h.id,
                        rawReqs.map((r) => ({
                            ...r,
                            householdId: h.id,
                            householdName: h.name,
                        })),
                    )
                    return next
                })
            }),
        )

        return () => unsubs.forEach((u) => u())
    }, [ownedHouseholds.map((h) => h.id).join(',')])

    const all: JoinRequest[] = []
    for (const reqs of byHousehold.values()) all.push(...reqs)
    all.sort((a, b) => b.ts - a.ts)
    return all
}
