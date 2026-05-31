// src/components/ui/NotificationPanel.tsx
import './NotificationPanel.css'
import type { JoinRequest } from '../../types'

const BellSVG = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
)

interface Props {
    requests: JoinRequest[]
    onApprove: (householdId: string, uid: string) => void
    onDeny: (householdId: string, uid: string) => void
    showHouseholdName?: boolean
    isRtl?: boolean
}

function fmtTime(ts: number): string {
    const d = new Date(ts)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export { BellSVG }

export function NotificationPanel({ requests, onApprove, onDeny, showHouseholdName, isRtl }: Props) {
    return (
        <div className="np-panel">
            <div className="np-title">
                {isRtl ? 'בקשות הצטרפות' : 'Join Requests'}
            </div>
            {requests.length === 0 ? (
                <div className="np-empty">
                    {isRtl ? 'אין בקשות ממתינות' : 'No pending requests'}
                </div>
            ) : (
                requests.map((r) => (
                    <div key={`${r.householdId}-${r.uid}`} className="np-item">
                        {r.photoURL ? (
                            <img src={r.photoURL} alt={r.name} className="np-avatar" />
                        ) : (
                            <div className="np-avatar-placeholder">{r.name[0]?.toUpperCase()}</div>
                        )}
                        <div className="np-info">
                            <div className="np-name">{r.name}</div>
                            <div className="np-meta">
                                {showHouseholdName
                                    ? `${r.householdName} · ${fmtTime(r.ts)}`
                                    : fmtTime(r.ts)}
                            </div>
                        </div>
                        <div className="np-actions">
                            <button className="np-approve" onClick={() => onApprove(r.householdId, r.uid)}>✓</button>
                            <button className="np-deny"    onClick={() => onDeny(r.householdId, r.uid)}>✕</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
