// src/components/app/SyncBar.tsx
import { useI18n } from '../../i18n/context'
import type { SyncStatus } from '../../hooks/useSyncStatus'
import './SyncBar.css'

interface Props {
    status: SyncStatus
}

export function SyncBar({ status }: Props) {
    const { t } = useI18n()
    return (
        <div className={`sync-bar sync-bar--${status}`}>
            <div className="sync-dot" />
            <span>{status === 'connected' ? t.syncConnected : t.syncConnecting}</span>
        </div>
    )
}
