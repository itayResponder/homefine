// src/hooks/useHouseholds.ts
import { useEffect, useState } from 'react'
import {
    subscribeUserHouseholds,
    subscribeHouseholdMeta,
    createHousehold,
    joinHousehold,
    leaveHousehold,
} from '../firebase/db'
import type { Household, HouseholdMeta } from '../types'

export const useHouseholds = (uid: string | undefined) => {
    const [households, setHouseholds] = useState<Household[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!uid) return

        const metaUnsubs = new Map<string, () => void>()
        const metaMap = new Map<string, HouseholdMeta>()

        const rebuild = () =>
            setHouseholds([...metaMap.entries()].map(([id, meta]) => ({ id, meta })))

        const unsubIds = subscribeUserHouseholds(uid, (ids) => {
            let removed = false
            for (const [id, unsub] of metaUnsubs) {
                if (!ids.includes(id)) {
                    unsub()
                    metaUnsubs.delete(id)
                    metaMap.delete(id)
                    removed = true
                }
            }
            if (removed) rebuild()

            ids.forEach((id) => {
                if (metaUnsubs.has(id)) return
                const unsub = subscribeHouseholdMeta(id, (meta) => {
                    if (meta) metaMap.set(id, meta)
                    else metaMap.delete(id)
                    rebuild()
                    setReady(true)
                })
                metaUnsubs.set(id, unsub)
            })

            if (ids.length === 0) setReady(true)
        })

        return () => {
            unsubIds()
            metaUnsubs.forEach((u) => u())
        }
    }, [uid])

    const create = (name: string) => uid ? createHousehold(name, uid) : Promise.reject()
    const join = (householdId: string) => uid ? joinHousehold(householdId, uid) : Promise.reject()
    const leave = (householdId: string) => uid ? leaveHousehold(householdId, uid) : Promise.reject()

    return { households, ready, create, join, leave }
}
