// src/components/app/AppHeader.tsx
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/context'
import { LanguageToggle } from '../LanguageToggle'
import type { AppUser } from '../../types'
import './AppHeader.css'

interface Props {
    user: AppUser | null
    onLogout: () => void
    onOpenSettings: () => void
    onOpenLogs: () => void
    onDashboard: () => void
}

export function AppHeader({ user, onLogout, onOpenSettings, onOpenLogs, onDashboard }: Props) {
    const { t } = useI18n()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menuOpen) return
        const close = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenuOpen(false)
        }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [menuOpen])

    const pick = (action: () => void) => {
        setMenuOpen(false)
        action()
    }

    return (
        <header className="ap-header">
            <div className="ap-logo">
                Home<span>Fine</span>
            </div>

            <div className="ap-user">
                <LanguageToggle />
                {user?.photoURL && (
                    <img src={user.photoURL} alt={user.displayName} className="ap-avatar" />
                )}

                <div className="ap-settings-wrap" ref={menuRef}>
                    <button
                        className="ap-settings-btn"
                        onClick={() => setMenuOpen((v) => !v)}
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
                            <button onClick={() => pick(onOpenSettings)}>{t.tabSettings}</button>
                            <button onClick={() => pick(onOpenLogs)}>{t.navLogs}</button>
                            <button className="ap-settings-dropdown-logout" onClick={() => pick(onLogout)}>{t.signOut}</button>
                        </div>
                    )}
                </div>

                <button onClick={onLogout} className="ap-logout-btn">
                    {t.signOut}
                </button>
            </div>
        </header>
    )
}
