import { useState, useEffect } from 'react'
import { subscribeWebhookDebug, deleteWebhookDebugEntry, deleteWebhookDebugEntries } from '../../../firebase/db'
import type { WebhookDebugEntry } from '../../../firebase/db'

interface Props {
    householdId: string
    isRtl: boolean
    onClose: () => void
}

function extractMerchant(title: string): string {
    return title.split(/\s{2,}/)[0] ?? title
}

function extractAmount(body: string): string {
    const m = body.match(/([\d,]+\.?\d*)/)
    return m ? `₪${m[1]}` : body
}

function fmtTs(ts: number, isRtl: boolean): string {
    return new Date(ts).toLocaleString(isRtl ? 'he-IL' : 'en-GB', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })
}

export function WebhookLogModal({ householdId, isRtl, onClose }: Props) {
    const [entries, setEntries] = useState<WebhookDebugEntry[]>([])
    const [tab, setTab] = useState<'ok' | 'failed'>('ok')

    useEffect(() => {
        return subscribeWebhookDebug(householdId, setEntries)
    }, [householdId])

    const okEntries = entries.filter(e => e.status === 'ok')
    const failedEntries = entries.filter(e => e.status === 'parse_failed')
    const visible = tab === 'ok' ? okEntries : failedEntries

    const handleClearTab = () => {
        const ids = visible.map(e => e.id)
        deleteWebhookDebugEntries(householdId, ids)
    }

    return (
        <div className="ap-modal-overlay" onClick={onClose}>
            <div className="ap-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="ap-modal-header">
                    <span>{isRtl ? 'לוג אוטומציה' : 'Automation Log'}</span>
                    <button onClick={onClose} className="ap-modal-close">✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                    <button
                        onClick={() => setTab('ok')}
                        style={{
                            padding: '5px 14px', fontSize: 12, fontWeight: tab === 'ok' ? 700 : 500,
                            borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            background: tab === 'ok' ? 'var(--ac)' : '#F1F5F9',
                            color: tab === 'ok' ? '#fff' : '#64748B',
                        }}
                    >
                        ✅ {isRtl ? 'הצליחו' : 'Succeeded'} ({okEntries.length})
                    </button>
                    <button
                        onClick={() => setTab('failed')}
                        style={{
                            padding: '5px 14px', fontSize: 12, fontWeight: tab === 'failed' ? 700 : 500,
                            borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            background: tab === 'failed' ? '#E11D48' : '#F1F5F9',
                            color: tab === 'failed' ? '#fff' : '#64748B',
                        }}
                    >
                        ❌ {isRtl ? 'כשלו' : 'Failed'} ({failedEntries.length})
                    </button>
                </div>

                <div className="ap-modal-body">
                    {visible.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: 13 }}>
                            {isRtl ? 'אין רשומות' : 'No entries'}
                        </div>
                    ) : (
                        visible.map(entry => (
                            <div key={entry.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 10,
                                padding: '10px 0',
                                borderBottom: '1px solid #F8FAFC',
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {tab === 'ok' ? (
                                        <>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {extractMerchant(entry.title)}
                                                {entry.isTest && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: '#FFFBEB', padding: '1px 6px', borderRadius: 10 }}>
                                                        TEST
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                                                {extractAmount(entry.body)}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-dark)', wordBreak: 'break-all' }}>
                                                {entry.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, wordBreak: 'break-all' }}>
                                                {entry.body}
                                            </div>
                                        </>
                                    )}
                                    <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 4 }}>
                                        {fmtTs(entry.ts, isRtl)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteWebhookDebugEntry(householdId, entry.id)}
                                    style={{
                                        flexShrink: 0, background: 'none', border: 'none',
                                        cursor: 'pointer', fontSize: 16, color: '#CBD5E1',
                                        lineHeight: 1, padding: '2px 4px',
                                    }}
                                >×</button>
                            </div>
                        ))
                    )}
                </div>

                {visible.length > 0 && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
                        <button
                            onClick={handleClearTab}
                            style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                        >
                            {isRtl ? 'נקה הכל' : 'Clear all'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
