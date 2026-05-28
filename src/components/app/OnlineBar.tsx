// src/components/app/OnlineBar.tsx
import { useI18n } from '../../i18n/context'
import type { PresenceMap } from '../../hooks/usePresence'
import './OnlineBar.css'

interface Props {
    online: PresenceMap
}

export function OnlineBar({ online }: Props) {
    const { t } = useI18n()
    const users = Object.values(online)

    return (
        <div className="online-bar">
            <span className="online-label">{t.onlineNow}</span>
            <div className="online-chips">
                {users.length === 0 ? (
                    <span className="online-nobody">{t.nobodyOnline}</span>
                ) : (
                    users.map((u) => (
                        <div key={u.name} className="online-chip">
                            <span className="online-dot" />
                            {u.name}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
