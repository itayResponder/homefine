// src/components/app/UserBar.tsx
import { useI18n } from '../../i18n/context'
import { LanguageToggle } from '../LanguageToggle'
import type { AppUser } from '../../types'
import './UserBar.css'

interface Props {
    user: AppUser | null
    memberColor?: string  // color of the current user's member entry
    onLogout: () => void
}

export function UserBar({ user, memberColor, onLogout }: Props) {
    const { t } = useI18n()

    const chipBg = memberColor ? memberColor + '22' : '#EEEDFF'
    const chipColor = memberColor ?? '#6C63FF'
    const initial = user?.displayName?.[0]?.toUpperCase() ?? '?'

    return (
        <div className="user-bar">
            {/* Avatar (rightmost in RTL) */}
            {user?.photoURL ? (
                <img
                    className="user-avatar"
                    src={user.photoURL}
                    alt={user.displayName}
                />
            ) : (
                <div
                    className="user-avatar-fallback"
                    style={{ background: chipBg, color: chipColor }}
                >
                    {initial}
                </div>
            )}

            {/* Name */}
            <span className="user-name">{user?.displayName ?? ''}</span>

            {/* Role chip */}
            <span
                className="user-role"
                style={{ background: chipBg, color: chipColor }}
            >
                {user?.displayName ?? ''}
            </span>

            {/* Language toggle */}
            <LanguageToggle />

            {/* Sign out (leftmost in RTL) */}
            <button
                className="signout-btn"
                onClick={onLogout}
                title={t.signOut}
            >
                ↗
            </button>
        </div>
    )
}
