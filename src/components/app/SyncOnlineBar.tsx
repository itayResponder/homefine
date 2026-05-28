// src/components/app/SyncOnlineBar.tsx
import { useI18n } from '../../i18n/context'
import type { SyncStatus } from '../../hooks/useSyncStatus'
import type { PresenceMap } from '../../hooks/usePresence'
import './SyncOnlineBar.css'

interface Props {
    syncStatus: SyncStatus
    online: PresenceMap
}

export function SyncOnlineBar({ syncStatus, online }: Props) {
    const { t } = useI18n()
    const users = Object.values(online)

    return (
        <>
            <div className={`sync-bar sync-${syncStatus}`}>
                <div className="sync-dot" />
                <span>
                    {syncStatus === 'connected' ? t.syncConnected : t.syncConnecting}
                </span>
            </div>

            <div className="online-bar">
                <span className="online-lbl">{t.onlineNow}</span>
                <div className="online-avatars">
                    {users.length === 0 ? (
                        <span style={{ color: '#C4C0F0' }}>{t.nobodyOnline}</span>
                    ) : (
                        users.map((u) => (
                            <div key={u.name} className="online-av">
                                <div className="online-av-dot" />
                                {u.name}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
