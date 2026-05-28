// src/components/app/AppHeader.tsx
import { useI18n } from '../../i18n/context'
import { LanguageToggle } from '../LanguageToggle'
import type { AppUser } from '../../types'
import './AppHeader.css'

interface Props {
    user: AppUser | null
    onLogout: () => void
}

export function AppHeader({ user, onLogout }: Props) {
    const { t } = useI18n()

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
                <button onClick={onLogout} className="ap-logout-btn">
                    {t.signOut}
                </button>
            </div>
        </header>
    )
}
