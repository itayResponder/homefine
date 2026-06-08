import { useI18n } from '../../../i18n/context'
import type { Member } from '../../../types'
import styles from '../SettingsView.module.css'

interface Props {
    myMember: Member
    onToggleMemberIncome: (member: Member) => void
}

export function IncomePrivacySection({ myMember, onToggleMemberIncome }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'

    return (
        <div className="fcard">
            <div className="fttl">🔒 {isRtl ? 'פרטיות הכנסות' : 'Income Privacy'}</div>
            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleTitle}>
                        {isRtl ? 'הסתר את ההכנסות שלי' : 'Hide my income'}
                    </div>
                    <div className={styles.toggleSubtitle}>
                        {isRtl ? 'רק אני אראה את ההכנסות שלי' : 'Only I can see my income'}
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
