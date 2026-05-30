// src/pages/JoinPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getHouseholdMeta, getUserHouseholdIds, joinHousehold } from '../firebase/db'
import type { HouseholdMeta } from '../types'
import './JoinPage.css'

export default function JoinPage() {
    const { householdId = '' } = useParams<{ householdId: string }>()
    const { user, loading: authLoading, login } = useAuth()
    const navigate = useNavigate()

    const [meta, setMeta] = useState<HouseholdMeta | null>(null)
    const [metaLoading, setMetaLoading] = useState(true)
    const [joining, setJoining] = useState(false)

    useEffect(() => {
        if (!householdId) return
        getHouseholdMeta(householdId).then((m) => {
            setMeta(m)
            setMetaLoading(false)
        })
    }, [householdId])

    // If logged in, check if already a member → redirect
    useEffect(() => {
        if (!user || !householdId) return
        getUserHouseholdIds(user.uid).then((ids) => {
            if (ids.includes(householdId)) navigate(`/app/${householdId}`, { replace: true })
        })
    }, [user, householdId, navigate])

    const handleJoin = async () => {
        if (!user || !householdId) return
        setJoining(true)
        await joinHousehold(householdId, user.uid)
        navigate(`/app/${householdId}`, { replace: true })
    }

    if (authLoading || metaLoading) {
        return (
            <div className="jp-center">
                <span className="jp-logo">Home<span>Fine</span></span>
            </div>
        )
    }

    if (!meta) {
        return (
            <div className="jp-center">
                <span className="jp-logo">Home<span>Fine</span></span>
                <p className="jp-error">הבית לא נמצא</p>
                <button className="jp-btn" onClick={() => navigate('/')}>חזרה</button>
            </div>
        )
    }

    return (
        <div className="jp-center">
            <span className="jp-logo">Home<span>Fine</span></span>
            <div className="jp-card">
                <div className="jp-house-icon">🏠</div>
                <div className="jp-title">הוזמנת להצטרף לבית</div>
                <div className="jp-name">{meta.name}</div>

                {!user ? (
                    <>
                        <p className="jp-sub">התחבר עם Google כדי להצטרף</p>
                        <button className="jp-btn jp-btn--google" onClick={login}>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            המשך עם Google
                        </button>
                    </>
                ) : (
                    <>
                        <p className="jp-sub">שלום, {user.displayName?.split(' ')[0]} 👋</p>
                        <button className="jp-btn" onClick={handleJoin} disabled={joining}>
                            {joining ? '...' : 'הצטרף לבית'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
