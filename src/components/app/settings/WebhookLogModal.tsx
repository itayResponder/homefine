import { useState, useEffect } from 'react'
import { useI18n } from '../../../i18n/context'
import { subscribeWebhookDebug, deleteWebhookDebugEntry, deleteWebhookDebugEntries } from '../../../firebase/db'
import type { WebhookDebugEntry } from '../../../firebase/db'
import './WebhookLogModal.css'

interface Props {
    householdId: string
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

export function WebhookLogModal({ householdId, onClose }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'
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
                    <span>{t.automationLog}</span>
                    <button onClick={onClose} className="ap-modal-close">✕</button>
                </div>

                <div className="wl-tabs">
                    <button
                        onClick={() => setTab('ok')}
                        className={`wl-tab wl-tab--ok${tab === 'ok' ? ' wl-tab--active' : ''}`}
                    >
                        ✅ {t.webhookSucceeded} ({okEntries.length})
                    </button>
                    <button
                        onClick={() => setTab('failed')}
                        className={`wl-tab wl-tab--failed${tab === 'failed' ? ' wl-tab--active' : ''}`}
                    >
                        ❌ {t.webhookFailed} ({failedEntries.length})
                    </button>
                </div>

                <div className="ap-modal-body">
                    {visible.length === 0 ? (
                        <div className="wl-empty">{t.webhookNoEntries}</div>
                    ) : (
                        visible.map(entry => (
                            <div key={entry.id} className="wl-entry">
                                <div className="wl-entry-body">
                                    {tab === 'ok' ? (
                                        <>
                                            <div className="wl-entry-merchant">
                                                {extractMerchant(entry.title)}
                                                {entry.isTest && (
                                                    <span className="wl-entry-test-badge">TEST</span>
                                                )}
                                            </div>
                                            <div className="wl-entry-amount">{extractAmount(entry.body)}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="wl-entry-title">{entry.title}</div>
                                            <div className="wl-entry-subtitle">{entry.body}</div>
                                        </>
                                    )}
                                    <div className="wl-entry-ts">{fmtTs(entry.ts, isRtl)}</div>
                                </div>
                                <button
                                    onClick={() => deleteWebhookDebugEntry(householdId, entry.id)}
                                    className="wl-entry-delete"
                                >×</button>
                            </div>
                        ))
                    )}
                </div>

                {visible.length > 0 && (
                    <div className="wl-footer">
                        <button onClick={handleClearTab} className="wl-clear-btn">
                            {t.webhookClearAll}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
