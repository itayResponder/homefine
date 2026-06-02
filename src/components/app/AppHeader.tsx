// src/components/app/AppHeader.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/context'
import { LanguageToggle } from '../LanguageToggle'
import { BellSVG, NotificationPanel } from '../ui/NotificationPanel'
import '../ui/NotificationPanel.css'
import type { AppUser, JoinRequest } from '../../types'
import './AppHeader.css'

interface Props {
    user: AppUser | null
    householdId: string
    onLogout: () => void
    onOpenSettings?: () => void
    onOpenLogs?: () => void
    onDashboard: () => void
    joinRequests?: JoinRequest[]
    onApproveJoin?: (householdId: string, uid: string) => void
    onDenyJoin?: (householdId: string, uid: string) => void
    onLeave?: () => void
    online?: Record<string, { name: string }>
}

const AVATAR_COLORS = ['#6366F1','#EC4899','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EF4444','#06B6D4']
function nameToColor(name: string): string {
    const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
    return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function AppHeader({
    user, householdId, onLogout, onOpenSettings, onOpenLogs, onDashboard,
    joinRequests = [], onApproveJoin, onDenyJoin, onLeave, online = {},
}: Props) {
    const { t } = useI18n()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const notifRef = useRef<HTMLDivElement>(null)

    const isHomeActive = pathname === `/app/${householdId}/home`
    const isFinanceActive = !isHomeActive

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
        }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const pick = (action: () => void) => { setMenuOpen(false); action() }
    const isOwner = onApproveJoin !== undefined

    const onlineUsers = Object.values(online)
    const MAX_SHOWN = 4
    const shownUsers = onlineUsers.slice(0, MAX_SHOWN)
    const overflow = onlineUsers.length - MAX_SHOWN

    return (
        <header className="ap-header">
            <div className="ap-logo">Home<span>Fine</span></div>

            {/* App navbar */}
            <nav className="ap-nav">
                <button
                    className={`ap-nav-btn${isFinanceActive ? ' ap-nav-btn--active' : ''}`}
                    onClick={() => navigate(`/app/${householdId}`)}
                >
                    {t.navFinance}
                </button>
                <button
                    className={`ap-nav-btn${isHomeActive ? ' ap-nav-btn--active' : ''}`}
                    onClick={() => navigate(`/app/${householdId}/home`)}
                >
                    {t.navHousehold}
                </button>
            </nav>

            <div className="ap-user">
                {onlineUsers.length > 0 && (
                    <div className="ah-online">
                        {shownUsers.map((u) => (
                            <div
                                key={u.name}
                                className="ah-online-avatar"
                                style={{ background: nameToColor(u.name) }}
                                title={u.name}
                            >
                                {u.name.charAt(0)}
                                <span className="ah-online-dot" />
                            </div>
                        ))}
                        {overflow > 0 && (
                            <span className="ah-online-more">+{overflow}</span>
                        )}
                    </div>
                )}
                <LanguageToggle />
                {user?.photoURL && (
                    <img src={user.photoURL} alt={user.displayName} className="ap-avatar" />
                )}

                {/* Notification bell — only shown for owners */}
                {isOwner && (
                    <div className="np-wrap" ref={notifRef}>
                        <button
                            className="ap-settings-btn"
                            onClick={() => { setNotifOpen((v) => !v); setMenuOpen(false) }}
                            aria-label="Notifications"
                        >
                            <BellSVG />
                            {joinRequests.length > 0 && (
                                <span className="ap-notif-badge">{joinRequests.length}</span>
                            )}
                        </button>
                        {notifOpen && (
                            <div className="np-dropdown">
                                <NotificationPanel
                                    requests={joinRequests}
                                    onApprove={onApproveJoin!}
                                    onDeny={onDenyJoin!}
                                    isRtl={t.dir === 'rtl'}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Settings dropdown */}
                <div className="ap-settings-wrap" ref={menuRef}>
                    <button
                        className="ap-settings-btn"
                        onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false) }}
                        aria-label="Settings menu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                    {menuOpen && (
                        <div className="ap-settings-dropdown">
                            <button onClick={() => pick(onDashboard)}>{t.myHouseholds}</button>
                            {onOpenSettings && (
                                <button onClick={() => pick(onOpenSettings)}>{t.tabSettings}</button>
                            )}
                            {onOpenLogs && (
                                <button onClick={() => pick(onOpenLogs)}>{t.navLogs}</button>
                            )}
                            {onLeave && (
                                <button className="ap-settings-dropdown-logout" onClick={() => pick(onLeave)}>
                                    {t.dir === 'rtl' ? 'עזוב בית' : 'Leave household'}
                                </button>
                            )}
                            <button className="ap-settings-dropdown-logout" onClick={() => pick(onLogout)}>{t.signOut}</button>
                        </div>
                    )}
                </div>

                <button onClick={onLogout} className="ap-logout-btn">{t.signOut}</button>
            </div>
        </header>
    )
}
