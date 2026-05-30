// src/pages/DashboardPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useHouseholds } from '../hooks/useHouseholds'
import { useUserColor } from '../hooks/useUserColor'
import { buildColorVars } from '../utils/color'
import { LanguageToggle } from '../components/LanguageToggle'
import { useI18n } from '../i18n/context'
import './DashboardPage.css'

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { t } = useI18n()
    const { color: primaryColor } = useUserColor(user?.uid)
    const { households, ready, create } = useHouseholds(user?.uid)

    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return
        setLoading(true)
        const id = await create(newName.trim())
        setLoading(false)
        navigate(`/app/${id}`)
    }

    const handleCopyLink = (householdId: string) => {
        const url = `${window.location.origin}/join/${householdId}`
        navigator.clipboard.writeText(url)
        setCopied(householdId)
        setTimeout(() => setCopied(null), 2000)
    }

    const isRtl = t.dir === 'rtl'

    if (!ready) {
        return (
            <div className="db-loading">
                <span className="db-logo">Home<span>Fine</span></span>
            </div>
        )
    }

    return (
        <div className="db-root" style={buildColorVars(primaryColor) as React.CSSProperties}>
            <header className="db-header">
                <div className="db-logo">Home<span>Fine</span></div>
                <div className="db-header-right">
                    <LanguageToggle />
                    {user?.photoURL && (
                        <img src={user.photoURL} alt={user.displayName} className="db-avatar" />
                    )}
                    <button className="db-logout" onClick={logout}>{t.signOut}</button>
                </div>
            </header>

            <main className="db-main">
                <div className="db-greeting">
                    {isRtl ? `שלום, ${user?.displayName?.split(' ')[0]} 👋` : `Hey, ${user?.displayName?.split(' ')[0]} 👋`}
                </div>
                <div className="db-subtitle">
                    {isRtl ? 'הבתים שלך' : 'Your households'}
                </div>

                <div className="db-grid">
                    {households.map((h) => (
                        <div key={h.id} className="db-card-wrap">
                            <button
                                className="db-card"
                                onClick={() => navigate(`/app/${h.id}`)}
                            >
                                <div className="db-card-icon">🏠</div>
                                <div className="db-card-name">{h.meta.name}</div>
                                {h.meta.ownerId === user?.uid && (
                                    <div className="db-card-owner">{isRtl ? 'בעלים' : 'Owner'}</div>
                                )}
                            </button>
                            <button
                                className="db-share-btn"
                                title={isRtl ? 'העתק קישור הצטרפות' : 'Copy invite link'}
                                onClick={() => handleCopyLink(h.id)}
                            >
                                {copied === h.id ? '✓' : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}

                    <button className="db-card db-card--add" onClick={() => setShowCreate(true)}>
                        <div className="db-card-icon">＋</div>
                        <div className="db-card-name">{isRtl ? 'בית חדש' : 'New household'}</div>
                    </button>
                </div>

                {showCreate && (
                    <div className="db-form-card">
                        <div className="db-form-title">{isRtl ? 'צור בית חדש' : 'Create new household'}</div>
                        <form onSubmit={handleCreate}>
                            <input
                                className="db-input"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={isRtl ? 'שם הבית...' : 'Household name...'}
                                autoFocus
                                required
                            />
                            <div className="db-form-actions">
                                <button type="submit" className="db-btn-primary" disabled={loading}>
                                    {loading ? '...' : (isRtl ? 'צור' : 'Create')}
                                </button>
                                <button type="button" className="db-btn-ghost" onClick={() => setShowCreate(false)}>
                                    {t.cancel}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </main>
        </div>
    )
}
