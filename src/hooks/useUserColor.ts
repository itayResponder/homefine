import { useEffect, useState } from 'react'
import { setUserColor, subscribeUserColor } from '../firebase/db'
import { DEFAULT_COLOR } from '../utils/color'

export function useUserColor(uid: string | undefined) {
    const [color, setColor] = useState(DEFAULT_COLOR)

    useEffect(() => {
        if (!uid) return
        return subscribeUserColor(uid, (c) => setColor(c ?? DEFAULT_COLOR))
    }, [uid])

    const updateColor = (newColor: string) => {
        if (!uid) return
        setColor(newColor)
        setUserColor(uid, newColor)
    }

    return { color, updateColor }
}
