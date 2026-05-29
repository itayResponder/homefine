import { useEffect, useState } from 'react'
import { setUserColor, subscribeUserColor } from '../firebase/db'
import { DEFAULT_COLOR } from '../utils/color'

const storageKey = (uid: string) => `hf_color_${uid}`

export function useUserColor(uid: string | undefined) {
    const [color, setColor] = useState(DEFAULT_COLOR)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!uid) return

        // Apply cached color instantly (no visible wait)
        const cached = localStorage.getItem(storageKey(uid))
        if (cached) {
            setColor(cached)
            setLoading(false)
        }

        // Always subscribe for fresh value from Firebase
        return subscribeUserColor(uid, (c) => {
            const resolved = c ?? DEFAULT_COLOR
            localStorage.setItem(storageKey(uid), resolved)
            setColor(resolved)
            setLoading(false)
        })
    }, [uid])

    const updateColor = (newColor: string) => {
        if (!uid) return
        setColor(newColor)
        localStorage.setItem(storageKey(uid), newColor)
        setUserColor(uid, newColor)
    }

    return { color, loading, updateColor }
}
