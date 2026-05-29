// src/components/app/LogsSection.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { formatCurrency } from '../../utils/format'
import type { LogEntry } from '../../types'
import './LogsSection.css'

interface Props {
    logs: LogEntry[]
    onDelete: (id: string) => void
    onClear: () => void
}

export function LogsSection({ logs, onDelete, onClear }: Props) {
    const { t } = useI18n()
    const [selected, setSelected] = useState<LogEntry | null>(null)
    const clearLabel = t.dir === 'rtl' ? 'מחק הכל' : 'Clear all'

    return (
        <div className="logs-section">
            <div className="logs-header">
                <span className="logs-title">{t.logsTitle}</span>
                {logs.length > 0 && <span className="logs-count">{logs.length}</span>}
                {logs.length > 0 && (
                    <button className="logs-clear-btn" onClick={onClear}>{clearLabel}</button>
                )}
            </div>

            {logs.length === 0 ? (
                <div className="logs-empty">
                    <span className="logs-empty-icon">📋</span>
                    <p>{t.noLogs}</p>
                </div>
            ) : (
                <div className="logs-list">
                    {logs.map((log) => (
                        <LogRow
                            key={log.id}
                            log={log}
                            onDelete={onDelete}
                            onClick={() => setSelected(log)}
                        />
                    ))}
                </div>
            )}

            {selected && (
                <LogDetailModal
                    log={selected}
                    onClose={() => setSelected(null)}
                    onDelete={(id) => { onDelete(id); setSelected(null) }}
                />
            )}
        </div>
    )
}

function LogRow({ log, onDelete, onClick }: {
    log: LogEntry
    onDelete: (id: string) => void
    onClick: () => void
}) {
    const { t } = useI18n()

    const actionLabel = { add: t.logAdd, edit: t.logEdit, delete: t.logDelete }[log.action]
    const actionClass = { add: 'log-action--add', edit: 'log-action--edit', delete: 'log-action--delete' }[log.action]

    const ts = new Date(log.ts)
    const timeStr = `${String(ts.getDate()).padStart(2, '0')}/${String(ts.getMonth() + 1).padStart(2, '0')} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`
    const sign = log.txType === 'income' ? '+' : '−'

    return (
        <div className="log-row" onClick={onClick}>
            <span className={`log-action ${actionClass}`}>{actionLabel}</span>
            <span className="log-who">{log.who}</span>
            <span className="log-row-desc">{log.description}</span>
            <span className="log-row-amt" dir="ltr">{formatCurrency(log.amount, t.dir, sign)}</span>
            <span className="log-time">{timeStr}</span>
            <button
                className="log-delete-btn"
                onClick={(e) => { e.stopPropagation(); onDelete(log.id) }}
                aria-label="Delete log"
            >✕</button>
        </div>
    )
}

function LogDetailModal({ log, onClose, onDelete }: {
    log: LogEntry
    onClose: () => void
    onDelete: (id: string) => void
}) {
    const { t } = useI18n()

    const actionLabel = { add: t.logAdd, edit: t.logEdit, delete: t.logDelete }[log.action]
    const actionClass = { add: 'log-action--add', edit: 'log-action--edit', delete: 'log-action--delete' }[log.action]

    const ts = new Date(log.ts)
    const timeStr = `${String(ts.getDate()).padStart(2, '0')}/${String(ts.getMonth() + 1).padStart(2, '0')}/${ts.getFullYear()} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`
    const sign = log.txType === 'income' ? '+' : '−'
    const deleteLabel = t.dir === 'rtl' ? 'מחק לוג' : 'Delete log'

    return (
        <div className="log-modal-overlay" onClick={onClose}>
            <div className="log-modal" onClick={(e) => e.stopPropagation()}>
                <div className="log-modal-header">
                    <span className={`log-action ${actionClass}`}>{actionLabel}</span>
                    <button className="log-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="log-modal-rows">
                    <div className="log-modal-row">
                        <span className="log-modal-label">{t.dir === 'rtl' ? 'מי' : 'Who'}</span>
                        <span className="log-modal-val">{log.who}</span>
                    </div>
                    <div className="log-modal-row">
                        <span className="log-modal-label">{t.dir === 'rtl' ? 'תיאור' : 'Description'}</span>
                        <span className="log-modal-val">{log.description}</span>
                    </div>
                    <div className="log-modal-row">
                        <span className="log-modal-label">{t.dir === 'rtl' ? 'סכום' : 'Amount'}</span>
                        <span className="log-modal-val" dir="ltr">{formatCurrency(log.amount, t.dir, sign)}</span>
                    </div>
                    {log.txType && (
                        <div className="log-modal-row">
                            <span className="log-modal-label">{t.dir === 'rtl' ? 'סוג' : 'Type'}</span>
                            <span className="log-modal-val">{log.txType === 'income' ? (t.dir === 'rtl' ? 'הכנסה' : 'Income') : (t.dir === 'rtl' ? 'הוצאה' : 'Expense')}</span>
                        </div>
                    )}
                    <div className="log-modal-row">
                        <span className="log-modal-label">{t.dir === 'rtl' ? 'זמן' : 'Time'}</span>
                        <span className="log-modal-val">{timeStr}</span>
                    </div>
                </div>

                {log.diffs && log.diffs.length > 0 && (
                    <div className="log-modal-diffs">
                        <div className="log-modal-diffs-title">{t.dir === 'rtl' ? 'שינויים' : 'Changes'}</div>
                        {log.diffs.map((d, i) => (
                            <div key={i} className="log-diff-row">
                                <span className="log-diff-field">{d.field}:</span>
                                <span className="log-diff-before">{d.before}</span>
                                <span className="log-diff-arrow">→</span>
                                <span className="log-diff-after">{d.after}</span>
                            </div>
                        ))}
                    </div>
                )}

                <button className="log-modal-delete" onClick={() => onDelete(log.id)}>
                    {deleteLabel}
                </button>
            </div>
        </div>
    )
}
