import { useI18n } from '../../../i18n/context'
import type { LogEntry, Member, RecurringCharge, Transaction } from '../../../types'
import styles from '../SettingsView.module.css'

interface Props {
    transactions: Transaction[]
    recurringCharges: RecurringCharge[]
    members: Member[]
    logs: LogEntry[]
}

export function ExportSection({ transactions, recurringCharges, members, logs }: Props) {
    const { t } = useI18n()

    const handleExport = () => {
        const data = { transactions, recurringCharges, members, logs }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'homefine-export.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="fcard">
            <div className="fttl">{t.exportTitle}</div>
            <button onClick={handleExport} className={styles.exportBtn}>
                {t.exportJsonBtn}
            </button>
        </div>
    )
}
