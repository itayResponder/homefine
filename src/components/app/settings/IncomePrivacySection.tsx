import { useI18n } from '../../../i18n/context'
import type { Member } from '../../../types'
import styles from '../SettingsView.module.css'

interface Props {
    myMember: Member
    onToggleMemberIncome: (member: Member) => void
}

export function IncomePrivacySection({ myMember, onToggleMemberIncome }: Props) {
    const { t } = useI18n()

    return (
        <div className="fcard">
            <div className="fttl">🔒 {t.settings.incomePrivacyTitle}</div>
            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleTitle}>
                        {t.settings.hideMyIncomeLabel}
                    </div>
                    <div className={styles.toggleSubtitle}>
                        {t.settings.hideMyIncomeDesc}
                    </div>
                </div>
                <button
                    onClick={() => onToggleMemberIncome(myMember)}
                    className={`${styles.toggle} ${myMember.privateIncome ? styles.toggleOn : ''}`}
                >
                    <span className={`${styles.toggleKnob} ${myMember.privateIncome ? styles.toggleKnobOn : ''}`} />
                </button>
            </div>
        </div>
    )
}
