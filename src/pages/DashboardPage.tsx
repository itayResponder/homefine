// src/pages/DashboardPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useHouseholds } from '../hooks/useHouseholds'
import { useJoinRequests } from '../hooks/useJoinRequests'
import { useUserColor } from '../hooks/useUserColor'
import { buildColorVars } from '../utils/color'
import { approveJoinRequest, denyJoinRequest, deleteHousehold } from '../firebase/db'
import { useConfirm } from '../contexts/ui'
import { BellSVG, NotificationPanel } from '../components/ui/NotificationPanel'
import '../components/ui/NotificationPanel.css'
import { LanguageToggle } from '../components/LanguageToggle'
import { useI18n } from '../i18n/context'
import './DashboardPage.css'

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'
    const { color: primaryColor } = useUserColor(user?.uid)
    const { households, ready, create } = useHouseholds(user?.uid)
    const { showConfirm } = useConfirm()

    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const settingsRef = useRef<HTMLDivElement>(null)
    const notifRef = useRef<HTMLDivElement>(null)

    // Join requests for all households I own
    const ownedHouseholds = households
        .filter((h) => h.meta.ownerId === user?.uid)
        .map((h) => ({ id: h.id, name: h.meta.name }))
    const joinRequests = useJoinRequests(ownedHouseholds)

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return
        setLoading(true)
        const id = await create(newName.trim())
        setLoading(false)
        navigate(`/app/${id}`)
    }

    const handleCopyLink = (e: React.MouseEvent, householdId: string) => {
        e.stopPropagation()
        const url = `${window.location.origin}/join/${householdId}`
        navigator.clipboard.writeText(url)
        setCopied(householdId)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleApprove = async (householdId: string, uid: string) => {
        await approveJoinRequest(householdId, uid)
    }

    const handleDeny = async (householdId: string, uid: string) => {
        await denyJoinRequest(householdId, uid)
    }

    const handleDeleteHousehold = async (e: React.MouseEvent, householdId: string, name: string) => {
        e.stopPropagation()
        const confirmed = await showConfirm({
            title: isRtl ? `מחיקת "${name}"` : `Delete "${name}"`,
            sub: isRtl ? 'כל הנתונים יימחקו לצמיתות וכל החברים יאבדו גישה.' : 'All data will be deleted and all members will lose access.',
            danger: true,
        })
        if (!confirmed) return
        await deleteHousehold(householdId)
    }

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

                    {/* Notification bell */}
                    <div className="np-wrap" ref={notifRef}>
                        <button
                            className="db-icon-btn"
                            onClick={() => { setNotifOpen((v) => !v); setSettingsOpen(false) }}
                            aria-label="Notifications"
                        >
                            <BellSVG />
                            {joinRequests.length > 0 && (
                                <span className="db-badge">{joinRequests.length}</span>
                            )}
                        </button>
                        {notifOpen && (
                            <div className="np-dropdown">
                                <NotificationPanel
                                    requests={joinRequests}
                                    onApprove={handleApprove}
                                    onDeny={handleDeny}
                                    showHouseholdName
                                    isRtl={isRtl}
                                />
                            </div>
                        )}
                    </div>

                    {/* Avatar */}
                    {user?.photoURL && (
                        <img src={user.photoURL} alt={user.displayName} className="db-avatar" />
                    )}

                    {/* Settings dropdown */}
                    <div className="db-settings-wrap" ref={settingsRef}>
                        <button
                            className="db-icon-btn"
                            onClick={() => { setSettingsOpen((v) => !v); setNotifOpen(false) }}
                            aria-label="Settings"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                        {settingsOpen && (
                            <div className="db-settings-menu">
                                <button className="db-settings-item db-settings-item--danger" onClick={logout}>
                                    {t.signOut}
                                </button>
                            </div>
                        )}
                    </div>
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
                        <div
                            key={h.id}
                            className="db-card"
                            onClick={() => navigate(`/app/${h.id}`)}
                        >
                            <button
                                className="db-card-link"
                                title={isRtl ? 'העתק קישור הצטרפות' : 'Copy invite link'}
                                onClick={(e) => handleCopyLink(e, h.id)}
                            >
                                {copied === h.id ? '✓' : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                    </svg>
                                )}
                            </button>
                            {h.meta.ownerId === user?.uid && (
                                <button
                                    className="db-card-delete"
                                    title={isRtl ? 'מחק בית' : 'Delete household'}
                                    onClick={(e) => handleDeleteHousehold(e, h.id, h.meta.name)}
                                >
                                    ✕
                                </button>
                            )}
                            <div className="db-card-icon">🏠</div>
                            <div className="db-card-name">{h.meta.name}</div>
                            {h.meta.ownerId === user?.uid && (
                                <div className="db-card-owner">{isRtl ? 'בעלים' : 'Owner'}</div>
                            )}
                        </div>
                    ))}

                    <div className="db-card db-card--add" onClick={() => setShowCreate(true)}>
                        <div className="db-card-icon">＋</div>
                        <div className="db-card-name">{isRtl ? 'בית חדש' : 'New household'}</div>
                    </div>
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
