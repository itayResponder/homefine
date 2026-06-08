import { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import type { HouseholdMeta, HouseholdSettings } from '../../../types'
import styles from '../SettingsView.module.css'

interface Props {
    meta: HouseholdMeta | null
    onUpdateSettings: (s: Partial<HouseholdSettings>) => void
    onRename: (name: string) => void
}

export function OwnerSettingsSection({ meta, onUpdateSettings, onRename }: Props) {
    const { t } = useI18n()
    const [renaming, setRenaming] = useState(false)
    const [newHouseName, setNewHouseName] = useState(meta?.name ?? '')

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault()
        const n = newHouseName.trim()
        if (n && n !== meta?.name) onRename(n)
        setRenaming(false)
    }

    return (
        <div className={`fcard ${styles.ownerCard}`}>
            <div className="fttl">👑 {t.settings.ownerSettingsTitle}</div>

            {/* Rename */}
            <div className={styles.renameSection}>
                <div className={styles.sectionLabel}>
                    {t.settings.householdNameLabel}
                </div>
                {renaming ? (
                    <form onSubmit={handleRename} className={styles.renameForm}>
                        <input className={`inp ${styles.renameInput}`} value={newHouseName} onChange={e => setNewHouseName(e.target.value)} autoFocus required />
                        <button type="submit" className={`sbtn ${styles.renameSubmitBtn}`}>✓</button>
                        <button type="button" onClick={() => setRenaming(false)} className={styles.renameCancelBtn}>✕</button>
                    </form>
                ) : (
                    <div className={styles.renameDisplay}>
                        <span className={styles.householdName}>{meta?.name}</span>
                        <button onClick={() => { setNewHouseName(meta?.name ?? ''); setRenaming(true) }} className={styles.renameBtn}>
                            {t.settings.renameBtn}
                        </button>
                    </div>
                )}
            </div>

            {/* Expenses-only toggle */}
            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleTitle}>
                        {t.settings.expensesOnlyLabel}
                    </div>
                    <div className={styles.toggleSubtitle}>
                        {t.settings.expensesOnlyDesc}
                    </div>
                </div>
                <button
                    onClick={() => onUpdateSettings({ expensesOnly: !meta?.settings?.expensesOnly })}
                    className={`${styles.toggle} ${meta?.settings?.expensesOnly ? styles.toggleOn : ''}`}
                >
                    <span className={`${styles.toggleKnob} ${meta?.settings?.expensesOnly ? styles.toggleKnobOn : ''}`} />
                </button>
            </div>
        </div>
    )
}
