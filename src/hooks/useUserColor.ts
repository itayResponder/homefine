import { useEffect, useState } from 'react'
import { get, ref } from 'firebase/database'
import { db } from '../firebase/config'
import {
    setUserColor,
    subscribeUserColor,
    setHouseholdColor,
    subscribeHouseholdColor,
    updateMember,
} from '../firebase/db'
import { DEFAULT_COLOR } from '../utils/color'

const storageKey = (uid: string, householdId?: string) =>
    householdId ? `hf_color_${uid}_${householdId}` : `hf_color_${uid}`

export function useUserColor(uid: string | undefined, householdId?: string) {
    const [color, setColor] = useState(DEFAULT_COLOR)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!uid) return

        const cached = localStorage.getItem(storageKey(uid, householdId))
        if (cached) {
            setColor(cached)
            setLoading(false)
        }

        if (householdId) {
            return subscribeHouseholdColor(uid, householdId, (c) => {
                const resolved = c ?? DEFAULT_COLOR
                localStorage.setItem(storageKey(uid, householdId), resolved)
                setColor(resolved)
                setLoading(false)
            })
        }

        return subscribeUserColor(uid, (c) => {
            const resolved = c ?? DEFAULT_COLOR
            localStorage.setItem(storageKey(uid), resolved)
            setColor(resolved)
            setLoading(false)
        })
    }, [uid, householdId])

    const updateColor = async (newColor: string) => {
        if (!uid) return
        setColor(newColor)
        localStorage.setItem(storageKey(uid, householdId), newColor)

        if (householdId) {
            await setHouseholdColor(uid, householdId, newColor)
            const membersSnap = await get(ref(db, `households/${householdId}/members`))
            const members = membersSnap.val() ?? {}
            const entry = Object.entries(members).find(([, m]: any) => m.userId === uid)
            if (entry) {
                const [memberId] = entry
                await updateMember(householdId, memberId, { color: newColor })
            }
        } else {
            setUserColor(uid, newColor)
        }
    }

    return { color, loading, updateColor }
}
