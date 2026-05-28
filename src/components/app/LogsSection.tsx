// src/components/app/LogsSection.tsx
import { useI18n } from '../../i18n/context'
import type { LogEntry } from '../../types'
import './LogsSection.css'

interface Props {
    logs: LogEntry[]
}

export function LogsSection({ logs }: Props) {
    const { t } = useI18n()

    return (
        <div className="logs-section">
            <div className="logs-header">
                <span className="logs-title">{t.logsTitle}</span>
                {logs.length > 0 && (
                    <span className="logs-count">{logs.length}</span>
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
                        <LogItem key={log.id} log={log} />
                    ))}
                </div>
            )}
        </div>
    )
}

function LogItem({ log }: { log: LogEntry }) {
    const { t } = useI18n()

    const actionLabel = {
        add: t.logAdd,
        edit: t.logEdit,
        delete: t.logDelete,
    }[log.action]

    const actionClass = {
        add: 'log-action--add',
        edit: 'log-action--edit',
        delete: 'log-action--delete',
    }[log.action]

    const ts = new Date(log.ts)
    const timeStr = `${String(ts.getDate()).padStart(2, '0')}/${String(ts.getMonth() + 1).padStart(2, '0')}/${ts.getFullYear()} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`

    const amtStr = `₪${log.amount.toLocaleString()}`
    const sign = log.txType === 'income' ? '+' : '−'

    return (
        <div className="log-item">
            <div className="log-item-header">
                <span className={`log-action ${actionClass}`}>{actionLabel}</span>
                <span className="log-who">{log.who}</span>
                <span className="log-desc">
                    {log.description} · {sign}{amtStr}
                </span>
                <span className="log-time">{timeStr}</span>
            </div>

            {log.diffs && log.diffs.length > 0 && (
                <div className="log-diffs">
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
        </div>
    )
}
